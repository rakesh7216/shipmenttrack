// Carrier-specific event code → unified status model normalizer

const STATUS = {
  IN_TRANSIT: 'in_transit',
  DELAYED: 'delayed',
  AWAITING_CUSTOMS: 'awaiting_customs',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  EXCEPTION: 'exception',
};

// FedEx event codes → unified status
const FEDEX_MAP = {
  OC: STATUS.IN_TRANSIT,      // Shipment information sent to FedEx
  PU: STATUS.IN_TRANSIT,      // Picked up
  AR: STATUS.IN_TRANSIT,      // Arrived at FedEx location
  DP: STATUS.IN_TRANSIT,      // Departed FedEx location
  OD: STATUS.OUT_FOR_DELIVERY,
  DL: STATUS.DELIVERED,
  EX: STATUS.EXCEPTION,
  DY: STATUS.DELAYED,
  CH: STATUS.AWAITING_CUSTOMS,
  CC: STATUS.AWAITING_CUSTOMS,
};

// UPS event codes → unified status
const UPS_MAP = {
  M:  STATUS.IN_TRANSIT,      // Manifest
  P:  STATUS.IN_TRANSIT,      // Package transferred
  I:  STATUS.IN_TRANSIT,      // In transit
  O:  STATUS.OUT_FOR_DELIVERY,
  D:  STATUS.DELIVERED,
  X:  STATUS.DELAYED,
  RS: STATUS.DELAYED,
  E:  STATUS.EXCEPTION,
  CB: STATUS.EXCEPTION,
  CI: STATUS.AWAITING_CUSTOMS,
  CA: STATUS.AWAITING_CUSTOMS,
};

// DHL event codes → unified status
const DHL_MAP = {
  PU: STATUS.IN_TRANSIT,
  CI: STATUS.IN_TRANSIT,
  WC: STATUS.IN_TRANSIT,
  AR: STATUS.IN_TRANSIT,
  DF: STATUS.IN_TRANSIT,
  OD: STATUS.OUT_FOR_DELIVERY,
  OK: STATUS.DELIVERED,
  DD: STATUS.DELIVERED,
  CH: STATUS.AWAITING_CUSTOMS,
  CD: STATUS.AWAITING_CUSTOMS,
  HL: STATUS.DELAYED,
  DX: STATUS.EXCEPTION,
};

// Maersk / generic freight codes
const MAERSK_MAP = {
  DEP: STATUS.IN_TRANSIT,
  TRN: STATUS.IN_TRANSIT,
  ARR: STATUS.IN_TRANSIT,
  REL: STATUS.OUT_FOR_DELIVERY,
  DLV: STATUS.DELIVERED,
  HOL: STATUS.AWAITING_CUSTOMS,
  DLY: STATUS.DELAYED,
  EXC: STATUS.EXCEPTION,
};

// IoT / GPS fallback
const IOT_MAP = {
  MOVING:    STATUS.IN_TRANSIT,
  IDLE:      STATUS.DELAYED,
  DELIVERED: STATUS.DELIVERED,
  ALERT:     STATUS.EXCEPTION,
};

const CARRIER_MAPS = { fedex: FEDEX_MAP, ups: UPS_MAP, dhl: DHL_MAP, maersk: MAERSK_MAP, iot: IOT_MAP };

/**
 * Normalize a raw carrier event payload into the unified ShipTrack event model.
 * @param {string} carrier  - carrier id (fedex | ups | dhl | maersk | iot)
 * @param {object} raw      - raw event object from carrier
 * @returns {object}        - normalized event
 */
export function normalizeEvent(carrier, raw) {
  const map = CARRIER_MAPS[carrier] || {};
  const rawCode = raw.code || raw.event_code || raw.statusCode || raw.eventType || 'UNKNOWN';
  const unifiedStatus = map[rawCode] || deriveStatusFromDescription(raw);

  return {
    id: raw.id || crypto.randomUUID(),
    timestamp: raw.timestamp || raw.time || raw.eventDateTime || new Date().toISOString(),
    status: unifiedStatus,
    rawCode,
    carrier,
    location: normalizeLocation(raw),
    description: raw.description || raw.message || raw.eventDescription || statusToDescription(unifiedStatus),
    rawPayload: raw,
  };
}

function normalizeLocation(raw) {
  if (typeof raw.location === 'string') return raw.location;
  if (raw.location?.city) return `${raw.location.city}${raw.location.state ? ', ' + raw.location.state : ''}, ${raw.location.country || ''}`.trim();
  if (raw.city) return `${raw.city}, ${raw.country || ''}`.trim();
  return 'Unknown location';
}

function statusToDescription(status) {
  const map = {
    in_transit: 'Shipment in transit',
    delayed: 'Shipment delayed',
    awaiting_customs: 'Awaiting customs clearance',
    out_for_delivery: 'Out for delivery',
    delivered: 'Successfully delivered',
    exception: 'Exception — requires attention',
  };
  return map[status] || 'Status update received';
}

function deriveStatusFromDescription(raw) {
  const text = (raw.description || raw.message || '').toLowerCase();
  if (text.includes('custom')) return STATUS.AWAITING_CUSTOMS;
  if (text.includes('deliver') && !text.includes('out')) return STATUS.DELIVERED;
  if (text.includes('out for delivery')) return STATUS.OUT_FOR_DELIVERY;
  if (text.includes('delay') || text.includes('late')) return STATUS.DELAYED;
  if (text.includes('exception') || text.includes('alert')) return STATUS.EXCEPTION;
  return STATUS.IN_TRANSIT;
}

export { STATUS };
