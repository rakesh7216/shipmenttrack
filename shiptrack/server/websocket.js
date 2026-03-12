// WebSocket server — broadcasts real-time shipment updates to connected clients
import { WebSocketServer } from 'ws';

let wss = null;
// clients: Map<ws, {userId, role, subscribedShipments}>
const clients = new Map();

export function initWebSocket(server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    // Parse auth from query string for simplicity
    const url = new URL(req.url, 'http://localhost');
    const userId = url.searchParams.get('userId') || 'anonymous';
    const role = url.searchParams.get('role') || 'customer';
    const shipments = url.searchParams.get('shipments')?.split(',') || [];

    clients.set(ws, { userId, role, subscribedShipments: shipments });

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'subscribe') {
          const meta = clients.get(ws);
          if (meta) meta.subscribedShipments = msg.shipments || [];
        }
      } catch {}
    });

    ws.on('close', () => clients.delete(ws));
    ws.on('error', () => clients.delete(ws));

    // Send connection acknowledgement
    ws.send(JSON.stringify({ type: 'connected', userId, role }));
  });

  console.log('✅ WebSocket server ready on /ws');
  return wss;
}

/**
 * Broadcast a shipment update to all relevant clients.
 * Ops sees everything; shipper sees their shipments; customer sees owned shipments.
 */
export function broadcast(type, shipment) {
  if (!wss) return;
  const payload = JSON.stringify({ type, shipment, timestamp: new Date().toISOString() });

  clients.forEach((meta, ws) => {
    if (ws.readyState !== 1) return; // OPEN = 1

    const { role, subscribedShipments } = meta;
    const allowed =
      role === 'ops' ||
      (role === 'shipper' && shipment.ownedBy?.includes(meta.userId)) ||
      shipment.ownedBy?.includes(meta.userId) ||
      subscribedShipments.includes(shipment.id) ||
      subscribedShipments.includes(shipment.trackingNumber);

    if (allowed) ws.send(payload);
  });
}
