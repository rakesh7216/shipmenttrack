// Analytics routes
import express from 'express';
import { shipments, carriers } from '../store.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET /api/analytics/summary
router.get('/summary', authMiddleware, requireRole('ops', 'shipper'), (req, res) => {
  const all = [...shipments.values()];
  const total = all.length;
  const onTime = all.filter(s => s.onTime).length;
  const delayed = all.filter(s => s.status === 'delayed').length;
  const exceptions = all.filter(s => s.status === 'exception').length;
  const delivered = all.filter(s => s.status === 'delivered').length;
  const customs = all.filter(s => s.status === 'awaiting_customs').length;
  const inTransit = all.filter(s => s.status === 'in_transit').length;
  const outForDelivery = all.filter(s => s.status === 'out_for_delivery').length;

  const otpRate = total ? Math.round((onTime / total) * 100) : 0;
  const avgDelay = all.filter(s => s.delayMinutes > 0).reduce((sum, s) => sum + s.delayMinutes, 0) /
    (all.filter(s => s.delayMinutes > 0).length || 1);

  res.json({
    total,
    onTime,
    delayed,
    exceptions,
    delivered,
    customs,
    inTransit,
    outForDelivery,
    otpRate,
    avgDelayMinutes: Math.round(avgDelay),
    delayCauses: [
      { cause: 'Severe Weather', count: 1, percentage: 35 },
      { cause: 'Customs Hold', count: 1, percentage: 28 },
      { cause: 'Traffic Congestion', count: 0, percentage: 18 },
      { cause: 'Mechanical Issue', count: 0, percentage: 10 },
      { cause: 'Address Exception', count: 1, percentage: 9 },
    ],
  });
});

// GET /api/analytics/carrier-sla
router.get('/carrier-sla', authMiddleware, requireRole('ops', 'shipper'), (req, res) => {
  const all = [...shipments.values()];
  const result = [];

  for (const [carrierId, carrier] of carriers) {
    const carrierShipments = all.filter(s => s.carrier === carrierId);
    if (carrierShipments.length === 0) continue;
    const onTime = carrierShipments.filter(s => s.onTime).length;
    const slaTarget = 95;
    const compliance = Math.round((onTime / carrierShipments.length) * 100);
    result.push({
      carrier: carrierId,
      name: carrier.name,
      logo: carrier.logo,
      total: carrierShipments.length,
      onTime,
      delayed: carrierShipments.length - onTime,
      slaTarget,
      compliance,
      slaStatus: compliance >= slaTarget ? 'met' : 'breached',
    });
  }
  res.json(result);
});

// GET /api/analytics/volume
router.get('/volume', authMiddleware, requireRole('ops', 'shipper'), (req, res) => {
  // Generate realistic 14-day volume data
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    days.push({
      date: d.toISOString().split('T')[0],
      shipments: Math.floor(Math.random() * 40) + 20,
      delivered: Math.floor(Math.random() * 30) + 15,
      delayed: Math.floor(Math.random() * 8) + 1,
    });
  }
  res.json(days);
});

// GET /api/analytics/routes
router.get('/routes', authMiddleware, requireRole('ops', 'shipper'), (req, res) => {
  const all = [...shipments.values()];
  const routes = all.map(s => ({
    id: s.id,
    trackingNumber: s.trackingNumber,
    carrier: s.carrier,
    status: s.status,
    waypoints: s.routeWaypoints,
    currentPosition: s.currentPosition,
    origin: s.origin,
    destination: s.destination,
  }));
  res.json(routes);
});

export default router;
