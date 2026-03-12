// Mock carrier GPS stream generator
// Simulates live IoT position updates for in-transit shipments every 3 seconds
import { shipments } from './store.js';
import { ingestPositionUpdate, ingestEvent } from './ingestion.js';

const MOVING_STATUSES = ['in_transit', 'out_for_delivery'];

export function startMockCarrierStream() {
  console.log('🛰️  Mock GPS stream started (3s interval)');

  setInterval(() => {
    for (const [, ship] of shipments) {
      if (!MOVING_STATUSES.includes(ship.status)) continue;
      if (!ship.routeWaypoints || ship.routeWaypoints.length === 0) continue;

      const waypoints = ship.routeWaypoints;
      const targetIdx = Math.min(ship.currentWaypointIndex + 1, waypoints.length - 1);
      const target = waypoints[targetIdx];

      // Interpolate position toward next waypoint
      const cur = ship.currentPosition;
      const speed = 0.08; // fraction per tick
      const newLat = cur.lat + (target[0] - cur.lat) * speed;
      const newLng = cur.lng + (target[1] - cur.lng) * speed;

      // Check if we've reached the waypoint (within ~100m threshold)
      const dist = Math.sqrt((target[0] - newLat) ** 2 + (target[1] - newLng) ** 2);
      if (dist < 0.001 && targetIdx < waypoints.length - 1) {
        ship.currentWaypointIndex = targetIdx;
      }

      ingestPositionUpdate(ship.id, newLat, newLng);

      // Simulate status transition: when reaching the last waypoint → delivered
      if (targetIdx === waypoints.length - 1 && dist < 0.002) {
        if (ship.status !== 'delivered') {
          ingestEvent(ship.carrier, ship.id, {
            code: ship.carrier === 'ups' ? 'D' : (ship.carrier === 'dhl' ? 'OK' : 'DL'),
            description: 'Successfully delivered to recipient',
            location: ship.destination.name,
            timestamp: new Date().toISOString(),
          });
        }
      }
    }
  }, 3000);
}
