// ETA recalculation engine
// Estimates delivery time based on distance, speed, traffic, and weather factors

const TRAFFIC_FACTORS = {
  clear:    1.0,
  light:    1.05,
  moderate: 1.2,
  heavy:    1.5,
  severe:   2.0,
};

const WEATHER_FACTORS = {
  clear: 1.0,
  cloudy: 1.02,
  rain: 1.1,
  snow: 1.4,
  storm: 1.8,
};

const BASE_SPEED_KMH = 60; // km/h average for ground freight

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg) { return deg * Math.PI / 180; }

/**
 * Calculate ETA in milliseconds from now.
 * @param {object} shipment  - full shipment object
 * @param {string} traffic   - traffic condition key
 * @param {string} weather   - weather condition key
 */
export function calculateETA(shipment, traffic = 'moderate', weather = 'clear') {
  const { currentPosition, destination, routeWaypoints, currentWaypointIndex } = shipment;

  let remainingKm = 0;

  // Sum distance from current position to next waypoint, then through remaining waypoints
  if (routeWaypoints && currentWaypointIndex < routeWaypoints.length) {
    const nextWaypoint = routeWaypoints[currentWaypointIndex];
    remainingKm += haversineKm(
      currentPosition.lat, currentPosition.lng,
      nextWaypoint[0], nextWaypoint[1]
    );
    for (let i = currentWaypointIndex + 1; i < routeWaypoints.length; i++) {
      const prev = routeWaypoints[i - 1];
      const curr = routeWaypoints[i];
      remainingKm += haversineKm(prev[0], prev[1], curr[0], curr[1]);
    }
  }

  // Add final leg to destination
  const lastWaypoint = routeWaypoints?.[routeWaypoints.length - 1] || currentPosition;
  remainingKm += haversineKm(
    lastWaypoint[0] || lastWaypoint.lat, lastWaypoint[1] || lastWaypoint.lng,
    destination.lat, destination.lng
  );

  const tf = TRAFFIC_FACTORS[traffic] || 1.0;
  const wf = WEATHER_FACTORS[weather] || 1.0;
  const effectiveSpeed = BASE_SPEED_KMH / (tf * wf);
  const hoursRemaining = remainingKm / effectiveSpeed;
  const msRemaining = hoursRemaining * 3600000;

  return {
    estimatedDelivery: new Date(Date.now() + msRemaining).toISOString(),
    remainingKm: Math.round(remainingKm),
    hoursRemaining: Math.round(hoursRemaining * 10) / 10,
    trafficFactor: tf,
    weatherFactor: wf,
  };
}

// Mock signals — in production these would come from traffic/weather APIs
export function getMockSignals(lat, lng) {
  const trafficOptions = ['clear', 'light', 'moderate', 'heavy'];
  const weatherOptions = ['clear', 'cloudy', 'rain'];
  return {
    traffic: trafficOptions[Math.floor(Math.abs(lat + lng) * 7) % trafficOptions.length],
    weather: weatherOptions[Math.floor(Math.abs(lat * lng) * 3) % weatherOptions.length],
  };
}
