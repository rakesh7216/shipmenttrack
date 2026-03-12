// Event ingestion pipeline — receives raw carrier events, normalizes, enriches, and broadcasts
import { normalizeEvent } from './normalizer.js';
import { calculateETA, getMockSignals } from './eta.js';
import { shipments, addEvent } from './store.js';
import { broadcast } from './websocket.js';
import { dispatchNotifications } from './notifications.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Ingest a raw carrier webhook payload.
 * @param {string} carrier   - carrier id
 * @param {string} shipmentId - internal shipment id
 * @param {object} rawPayload - raw carrier event data
 */
export async function ingestEvent(carrier, shipmentId, rawPayload) {
  const shipment = shipments.get(shipmentId);
  if (!shipment) {
    console.warn(`[Ingestion] Unknown shipment: ${shipmentId}`);
    return null;
  }

  // 1. Normalize carrier-specific codes → unified model
  const event = normalizeEvent(carrier, rawPayload);
  event.id = event.id || uuidv4();

  // 2. Enrich with traffic + weather signals based on current position
  const signals = getMockSignals(
    shipment.currentPosition.lat,
    shipment.currentPosition.lng
  );
  shipment.traffic = signals.traffic;
  shipment.weather = signals.weather;

  // 3. Update shipment state
  const updated = addEvent(shipmentId, event);
  if (!updated) return null;

  // 4. Recalculate ETA if shipment is not yet delivered
  if (!['delivered', 'exception'].includes(event.status)) {
    const eta = calculateETA(updated, signals.traffic, signals.weather);
    updated.estimatedDelivery = eta.estimatedDelivery;
    updated.remainingKm = eta.remainingKm;
    updated.hoursRemaining = eta.hoursRemaining;
  }

  // 5. Broadcast update to WebSocket clients
  broadcast('shipment_update', updated);

  // 6. Dispatch notifications to subscribed users
  dispatchNotifications(updated, event);

  console.log(`[Ingestion] ✅ ${carrier.toUpperCase()} event ingested — ${shipment.trackingNumber} → ${event.status}`);
  return updated;
}

/**
 * Ingest a GPS position update (from IoT/telematics devices).
 */
export function ingestPositionUpdate(shipmentId, lat, lng) {
  const shipment = shipments.get(shipmentId);
  if (!shipment) return null;

  shipment.currentPosition = { lat, lng };
  shipment.updatedAt = new Date().toISOString();

  const signals = getMockSignals(lat, lng);
  const eta = calculateETA(shipment, signals.traffic, signals.weather);
  shipment.estimatedDelivery = eta.estimatedDelivery;
  shipment.remainingKm = eta.remainingKm;

  broadcast('position_update', {
    id: shipment.id,
    trackingNumber: shipment.trackingNumber,
    currentPosition: { lat, lng },
    estimatedDelivery: shipment.estimatedDelivery,
    remainingKm: shipment.remainingKm,
    ownedBy: shipment.ownedBy,
  });

  return shipment;
}
