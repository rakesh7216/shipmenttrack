// Main server entry point
import express from 'express';
import http from 'http';
import cors from 'cors';
import { createRequire } from 'module';
import authRoutes from './routes/auth.js';
import shipmentRoutes from './routes/shipments.js';
import analyticsRoutes from './routes/analytics.js';
import chatRoutes from './routes/chat.js';
import { initWebSocket } from './websocket.js';
import { startMockCarrierStream } from './mockCarrier.js';
import { ingestEvent } from './ingestion.js';
import { shipments } from './store.js';

const app = express();
const server = http.createServer(app);

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json());

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/chat', chatRoutes);

// Public tracking (no auth)
app.get('/api/tracking/:trackingNumber', (req, res) => {
  const ship = [...shipments.values()].find(
    s => s.trackingNumber === req.params.trackingNumber
  );
  if (!ship) return res.status(404).json({ error: 'Shipment not found' });
  res.json({
    trackingNumber: ship.trackingNumber,
    carrier: ship.carrier,
    status: ship.status,
    description: ship.description,
    origin: ship.origin,
    destination: ship.destination,
    currentPosition: ship.currentPosition,
    estimatedDelivery: ship.estimatedDelivery,
    remainingKm: ship.remainingKm,
    events: ship.events,
    routeWaypoints: ship.routeWaypoints,
    updatedAt: ship.updatedAt,
  });
});

// Carrier webhook simulation endpoint
app.post('/api/webhooks/:carrier/:shipmentId', async (req, res) => {
  const { carrier, shipmentId } = req.params;
  const updated = await ingestEvent(carrier, shipmentId, req.body);
  if (!updated) return res.status(404).json({ error: 'Shipment not found' });
  res.json({ ok: true, status: updated.status });
});

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Provide Static Files (Render / Production) ─────────────────────────────────
app.use(express.static(path.join(__dirname, '../dist')));

// ── WebSocket ──────────────────────────────────────────────────────────────────
initWebSocket(server);

// ── Fallback ───────────────────────────────────────────────────────────────────
// For client-side routing, serve index.html for unknown routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// ── Start ──────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 ShipTrack API running on port ${PORT}`);
  startMockCarrierStream();
});
