// Shipment routes
import express from 'express';
import { shipments, carriers, notificationPrefs, notificationLog, users, saveStore } from '../store.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { ingestEvent } from '../ingestion.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Helper: filter shipments by user role
function getVisibleShipments(user) {
  const all = [...shipments.values()];
  if (user.role === 'ops') return all;
  return all.filter(s => s.ownedBy?.includes(user.id));
}

// GET /api/shipments
router.get('/', authMiddleware, (req, res) => {
  let list = getVisibleShipments(req.user);

  const { status, carrier, search } = req.query;
  if (status) list = list.filter(s => s.status === status);
  if (carrier) list = list.filter(s => s.carrier === carrier);
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(s =>
      s.trackingNumber.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.origin.name.toLowerCase().includes(q) ||
      s.destination.name.toLowerCase().includes(q)
    );
  }

  // Return summary view (no full event history)
  res.json(list.map(s => ({
    id: s.id,
    trackingNumber: s.trackingNumber,
    carrier: s.carrier,
    carrierName: carriers.get(s.carrier)?.name,
    carrierLogo: carriers.get(s.carrier)?.logo,
    status: s.status,
    description: s.description,
    origin: s.origin,
    destination: s.destination,
    currentPosition: s.currentPosition,
    estimatedDelivery: s.estimatedDelivery,
    onTime: s.onTime,
    delayMinutes: s.delayMinutes,
    service: s.service,
    weight: s.weight,
    updatedAt: s.updatedAt,
    lastEvent: s.events[s.events.length - 1],
  })));
});

// POST /api/shipments
router.post('/', authMiddleware, requireRole('ops', 'shipper'), (req, res) => {
  const { trackingNumber, carrier, description, customerEmail, origin, destination, weight, dimensions, service } = req.body;
  
  if (!trackingNumber || !carrier || !origin || !destination) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Find customer by email to assign ownership
  const owners = [req.user.id];
  if (customerEmail) {
    const cust = [...users.values()].find(u => u.email.toLowerCase() === customerEmail.toLowerCase() && u.role === 'customer');
    if (cust) owners.push(cust.id);
  }

  const newShipment = {
    id: `shp-${Date.now()}`,
    trackingNumber,
    carrier,
    carrierTrackingId: trackingNumber,
    status: 'in_transit',
    description: description || 'New Shipment',
    origin,
    destination,
    currentPosition: { lat: origin.lat, lng: origin.lng },
    routeWaypoints: [[origin.lat, origin.lng], [destination.lat, destination.lng]],
    currentWaypointIndex: 0,
    estimatedDelivery: new Date(Date.now() + 48 * 3600000).toISOString(),
    weight: weight || '-', 
    dimensions: dimensions || '-',
    service: service || 'Standard',
    events: [{
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      status: 'in_transit',
      location: origin.name,
      description: 'Shipment created',
      rawCode: 'CR'
    }],
    ownedBy: owners,
    onTime: true,
    delayMinutes: 0,
    traffic: 'light',
    weather: 'clear',
    updatedAt: new Date().toISOString()
  };

  shipments.set(newShipment.id, newShipment);
  saveStore();
  res.status(201).json(newShipment);
});

// GET /api/shipments/:id
router.get('/:id', authMiddleware, (req, res) => {
  const ship = shipments.get(req.params.id);
  if (!ship) return res.status(404).json({ error: 'Shipment not found' });

  // Role check
  if (req.user.role !== 'ops' && !ship.ownedBy?.includes(req.user.id)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Find associated customer
  let customerDetails = null;
  if (ship.ownedBy) {
    const cust = [...users.values()].find(u => u.role === 'customer' && ship.ownedBy.includes(u.id));
    if (cust) {
      customerDetails = { name: cust.name, email: cust.email };
    }
  }

  res.json({
    ...ship,
    carrierName: carriers.get(ship.carrier)?.name,
    carrierLogo: carriers.get(ship.carrier)?.logo,
    carrierColor: carriers.get(ship.carrier)?.color,
    customer: customerDetails,
  });
});

// POST /api/shipments/:id/events — manual event injection (ops)
router.post('/:id/events', authMiddleware, requireRole('ops', 'shipper'), async (req, res) => {
  const ship = shipments.get(req.params.id);
  if (!ship) return res.status(404).json({ error: 'Shipment not found' });

  const { code, description, location } = req.body;
  if (!code) return res.status(400).json({ error: 'Event code required' });

  const updated = await ingestEvent(ship.carrier, ship.id, {
    id: uuidv4(),
    code,
    description: description || '',
    location: location || ship.currentPosition,
    timestamp: new Date().toISOString(),
  });

  res.json(updated);
});

// GET /api/tracking/:trackingNumber — public, no auth
router.get('/public/:trackingNumber', (req, res) => {
  const ship = [...shipments.values()].find(
    s => s.trackingNumber === req.params.trackingNumber
  );
  if (!ship) return res.status(404).json({ error: 'Shipment not found' });

  // Public view: limited fields
  res.json({
    trackingNumber: ship.trackingNumber,
    carrier: ship.carrier,
    carrierName: carriers.get(ship.carrier)?.name,
    carrierLogo: carriers.get(ship.carrier)?.logo,
    status: ship.status,
    description: ship.description,
    origin: ship.origin,
    destination: ship.destination,
    currentPosition: ship.currentPosition,
    estimatedDelivery: ship.estimatedDelivery,
    remainingKm: ship.remainingKm,
    events: ship.events.map(e => ({
      id: e.id,
      timestamp: e.timestamp,
      status: e.status,
      location: e.location,
      description: e.description,
    })),
    routeWaypoints: ship.routeWaypoints,
    updatedAt: ship.updatedAt,
  });
});

// GET /api/shipments/carriers/list
router.get('/meta/carriers', authMiddleware, (req, res) => {
  res.json([...carriers.values()]);
});

// GET /api/notifications/prefs
router.get('/notifications/prefs', authMiddleware, (req, res) => {
  res.json(notificationPrefs.get(req.user.id) || {});
});

// PUT /api/notifications/prefs
router.put('/notifications/prefs', authMiddleware, (req, res) => {
  notificationPrefs.set(req.user.id, { ...notificationPrefs.get(req.user.id), ...req.body });
  saveStore();
  res.json(notificationPrefs.get(req.user.id));
});

// GET /api/notifications/log
router.get('/notifications/log', authMiddleware, (req, res) => {
  const role = req.user.role;
  const userId = req.user.id;
  const log = role === 'ops'
    ? notificationLog
    : notificationLog.filter(n => n.userId === userId);
  res.json(log.slice(0, 50));
});

// DELETE /api/shipments/:id
router.delete('/:id', authMiddleware, requireRole('ops', 'shipper'), (req, res) => {
  const ship = shipments.get(req.params.id);
  if (!ship) return res.status(404).json({ error: 'Shipment not found' });

  // Ownership check for shippers
  if (req.user.role !== 'ops' && !ship.ownedBy?.includes(req.user.id)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  shipments.delete(req.params.id);
  saveStore();
  res.json({ ok: true, deleted: req.params.id });
});

export default router;
