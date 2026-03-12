// In-memory data store — loaded/persisted to data.json
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'data.json');

// ── Users ─────────────────────────────────────────────────────────────────────
export const users = new Map([
  ['customer@demo.com', { id: 'u1', email: 'customer@demo.com', name: 'Alex Chen', role: 'customer', password: 'demo', ownedShipments: ['shp-001', 'shp-002'] }],
  ['shipper@demo.com',  { id: 'u2', email: 'shipper@demo.com',  name: 'Maria Santos', role: 'shipper', password: 'demo', ownedShipments: ['shp-001','shp-002','shp-003','shp-004','shp-005'] }],
  ['ops@demo.com',      { id: 'u3', email: 'ops@demo.com',      name: 'James Wright', role: 'ops', password: 'demo', ownedShipments: [] }],
]);

// ── Carrier Configurations ────────────────────────────────────────────────────
export const carriers = new Map([
  ['fedex',  { id: 'fedex',  name: 'FedEx',          logo: '🟣', color: '#4D148C' }],
  ['ups',    { id: 'ups',    name: 'UPS',             logo: '🟤', color: '#351C15' }],
  ['dhl',    { id: 'dhl',    name: 'DHL',             logo: '🟡', color: '#FFCC00' }],
  ['maersk', { id: 'maersk', name: 'Maersk',          logo: '🔵', color: '#003DA5' }],
  ['iot',    { id: 'iot',    name: 'IoT Direct',       logo: '📡', color: '#00C7B7' }],
]);

// ── Notification Preferences ──────────────────────────────────────────────────
export const notificationPrefs = new Map([
  ['u1', { email: true, sms: true, push: false, milestones: ['pickup','out_for_delivery','delivered','exception'] }],
  ['u2', { email: true, sms: false, push: true, milestones: ['pickup','delayed','out_for_delivery','delivered','exception','awaiting_customs'] }],
  ['u3', { email: true, sms: true, push: true, milestones: ['delayed','exception','awaiting_customs'] }],
]);

// ── Notification Log ──────────────────────────────────────────────────────────
export const notificationLog = [];

// ── Route waypoints for simulation ───────────────────────────────────────────
const routes = {
  'shp-001': [
    [37.7749, -122.4194], [37.8044, -122.2712], [37.8716, -122.2727],
    [37.9101, -122.0652], [37.9577, -121.8904], [38.0194, -121.8059],
  ],
  'shp-002': [
    [40.7128, -74.0060], [40.7488, -73.9680], [40.7831, -73.9712],
    [40.8448, -73.8648], [40.8955, -73.8523], [40.9176, -73.8421],
  ],
  'shp-003': [
    [51.5074, -0.1278], [51.5155, -0.0922], [51.5247, -0.0546],
    [51.5400, -0.0100], [51.5560,  0.0302], [51.5788,  0.0843],
  ],
  'shp-004': [
    [48.8566,  2.3522], [48.8600,  2.4000], [48.8700,  2.4500],
    [48.8900,  2.5200], [48.9100,  2.5900],
  ],
  'shp-005': [
    [35.6762, 139.6503], [35.6900, 139.7100], [35.7100, 139.7600],
    [35.7200, 139.7900],
  ],
};

// ── Shipments ─────────────────────────────────────────────────────────────────
const now = Date.now();
const h = (n) => new Date(now - n * 3600000).toISOString();

const shipmentData = [
  {
    id: 'shp-001',
    trackingNumber: 'TRK-001',
    carrier: 'fedex',
    carrierTrackingId: 'FX9281933002',
    status: 'out_for_delivery',
    description: 'Electronics — MacBook Pro',
    origin: { name: 'San Francisco, CA', lat: 37.7749, lng: -122.4194 },
    destination: { name: 'Sacramento, CA', lat: 38.5816, lng: -121.4944 },
    currentPosition: { lat: 37.9577, lng: -121.8904 },
    routeWaypoints: routes['shp-001'],
    currentWaypointIndex: 3,
    estimatedDelivery: new Date(now + 4 * 3600000).toISOString(),
    weight: '2.1 kg', dimensions: '35×25×5 cm',
    service: 'FedEx Priority Overnight',
    events: [
      { id: uuidv4(), timestamp: h(14), status: 'in_transit',       location: 'San Francisco, CA',  description: 'Shipment picked up', rawCode: 'OC' },
      { id: uuidv4(), timestamp: h(10), status: 'in_transit',       location: 'Oakland Hub, CA',    description: 'Arrived at sort facility', rawCode: 'AR' },
      { id: uuidv4(), timestamp: h(6),  status: 'in_transit',       location: 'Oakland Hub, CA',    description: 'Departed facility', rawCode: 'DP' },
      { id: uuidv4(), timestamp: h(2),  status: 'out_for_delivery', location: 'Hayward, CA',        description: 'Out for delivery', rawCode: 'OD' },
    ],
    ownedBy: ['u1', 'u2', 'u3'],
    onTime: true, delayMinutes: 0, traffic: 'moderate', weather: 'clear',
  },
  {
    id: 'shp-002',
    trackingNumber: 'TRK-002',
    carrier: 'ups',
    carrierTrackingId: 'UP1Z999AA10123456784',
    status: 'delayed',
    description: 'Apparel — Winter Collection',
    origin: { name: 'New York, NY', lat: 40.7128, lng: -74.0060 },
    destination: { name: 'Yonkers, NY', lat: 40.9312, lng: -73.8988 },
    currentPosition: { lat: 40.7831, lng: -73.9712 },
    routeWaypoints: routes['shp-002'],
    currentWaypointIndex: 2,
    estimatedDelivery: new Date(now + 10 * 3600000).toISOString(),
    weight: '5.4 kg', dimensions: '60×40×30 cm',
    service: 'UPS Ground',
    events: [
      { id: uuidv4(), timestamp: h(20), status: 'in_transit', location: 'New York, NY',       description: 'Package received', rawCode: 'M' },
      { id: uuidv4(), timestamp: h(15), status: 'in_transit', location: 'Newark Hub, NJ',     description: 'Processing at facility', rawCode: 'I' },
      { id: uuidv4(), timestamp: h(8),  status: 'delayed',    location: 'Bronx Hub, NY',       description: 'Delay — severe weather conditions', rawCode: 'X' },
      { id: uuidv4(), timestamp: h(3),  status: 'delayed',    location: 'Bronx Hub, NY',       description: 'Package rescheduled', rawCode: 'RS' },
    ],
    ownedBy: ['u1', 'u2', 'u3'],
    onTime: false, delayMinutes: 180, traffic: 'heavy', weather: 'snow',
  },
  {
    id: 'shp-003',
    trackingNumber: 'TRK-003',
    carrier: 'dhl',
    carrierTrackingId: 'DHL1234567890',
    status: 'awaiting_customs',
    description: 'Industrial Equipment',
    origin: { name: 'London, UK', lat: 51.5074, lng: -0.1278 },
    destination: { name: 'Tilbury Port, UK', lat: 51.4639, lng: 0.3575 },
    currentPosition: { lat: 51.5247, lng: -0.0546 },
    routeWaypoints: routes['shp-003'],
    currentWaypointIndex: 2,
    estimatedDelivery: new Date(now + 48 * 3600000).toISOString(),
    weight: '120 kg', dimensions: '100×80×60 cm',
    service: 'DHL Express Worldwide',
    events: [
      { id: uuidv4(), timestamp: h(30), status: 'in_transit',         location: 'Heathrow Hub, UK',    description: 'Shipment collected', rawCode: 'PU' },
      { id: uuidv4(), timestamp: h(24), status: 'in_transit',         location: 'Heathrow Hub, UK',    description: 'Customs documents submitted', rawCode: 'CI' },
      { id: uuidv4(), timestamp: h(12), status: 'awaiting_customs',    location: 'Tilbury Port, UK',    description: 'Held for customs inspection', rawCode: 'CH' },
    ],
    ownedBy: ['u2', 'u3'],
    onTime: false, delayMinutes: 720, traffic: 'light', weather: 'rain',
  },
  {
    id: 'shp-004',
    trackingNumber: 'TRK-004',
    carrier: 'maersk',
    carrierTrackingId: 'MSK-CTR-883921',
    status: 'in_transit',
    description: 'Container — Mixed Goods',
    origin: { name: 'Paris, France', lat: 48.8566, lng: 2.3522 },
    destination: { name: 'Brussels, Belgium', lat: 50.8503, lng: 4.3517 },
    currentPosition: { lat: 48.8700, lng: 2.4500 },
    routeWaypoints: routes['shp-004'],
    currentWaypointIndex: 2,
    estimatedDelivery: new Date(now + 20 * 3600000).toISOString(),
    weight: '2400 kg', dimensions: '600×240×260 cm',
    service: 'Maersk Road Freight',
    events: [
      { id: uuidv4(), timestamp: h(10), status: 'in_transit', location: 'Paris, France',       description: 'Container loaded and departed', rawCode: 'DEP' },
      { id: uuidv4(), timestamp: h(6),  status: 'in_transit', location: 'Aachen, Germany',     description: 'In transit — on schedule', rawCode: 'TRN' },
    ],
    ownedBy: ['u2', 'u3'],
    onTime: true, delayMinutes: 0, traffic: 'light', weather: 'clear',
  },
  {
    id: 'shp-005',
    trackingNumber: 'TRK-005',
    carrier: 'fedex',
    carrierTrackingId: 'FX7781001234',
    status: 'exception',
    description: 'Pharmaceuticals — Cold Chain',
    origin: { name: 'Tokyo, Japan', lat: 35.6762, lng: 139.6503 },
    destination: { name: 'Narita, Japan', lat: 35.7720, lng: 140.3929 },
    currentPosition: { lat: 35.7100, lng: 139.7600 },
    routeWaypoints: routes['shp-005'],
    currentWaypointIndex: 2,
    estimatedDelivery: new Date(now + 30 * 3600000).toISOString(),
    weight: '8.2 kg', dimensions: '40×30×30 cm',
    service: 'FedEx International Priority',
    events: [
      { id: uuidv4(), timestamp: h(18), status: 'in_transit', location: 'Tokyo Hub, Japan',    description: 'Package collected at origin', rawCode: 'OC' },
      { id: uuidv4(), timestamp: h(12), status: 'in_transit', location: 'Tokyo Hub, Japan',    description: 'Loaded on vehicle', rawCode: 'AR' },
      { id: uuidv4(), timestamp: h(4),  status: 'exception',  location: 'Chiba, Japan',        description: 'Exception — temperature excursion detected', rawCode: 'EX' },
    ],
    ownedBy: ['u2', 'u3'],
    onTime: false, delayMinutes: 120, traffic: 'moderate', weather: 'clear',
  },
];

export const shipments = new Map(shipmentData.map(s => [s.id, s]));

// Helper to add event and return updated shipment
export function addEvent(shipmentId, event) {
  const ship = shipments.get(shipmentId);
  if (!ship) return null;
  ship.events.push(event);
  ship.status = event.status;
  ship.updatedAt = new Date().toISOString();
  saveStore();
  return ship;
}

// Helper to update position
export function updatePosition(shipmentId, lat, lng, waypointIndex) {
  const ship = shipments.get(shipmentId);
  if (!ship) return null;
  ship.currentPosition = { lat, lng };
  ship.currentWaypointIndex = waypointIndex;
  ship.updatedAt = new Date().toISOString();
  saveStore();
  return ship;
}

export function saveStore() {
  const data = {
    users: [...users.values()],
    carriers: [...carriers.values()],
    notificationPrefs: [...notificationPrefs.entries()],
    notificationLog,
    shipments: [...shipments.values()]
  };
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

export function loadStore() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      
      users.clear();
      data.users.forEach(u => users.set(u.email, u));
      
      carriers.clear();
      data.carriers.forEach(c => carriers.set(c.id, c));
      
      notificationPrefs.clear();
      data.notificationPrefs.forEach(([k, v]) => notificationPrefs.set(k, v));
      
      notificationLog.length = 0;
      notificationLog.push(...data.notificationLog);
      
      shipments.clear();
      data.shipments.forEach(s => shipments.set(s.id, s));
      console.log('📦 Loaded database from data.json');
    } catch (e) {
      console.error('⚠️ Failed to load data.json, using defaults:', e.message);
      saveStore();
    }
  } else {
    console.log('🆕 Creating new data.json with default seed data');
    saveStore();
  }
}

// Load data immediately on boot
loadStore();
