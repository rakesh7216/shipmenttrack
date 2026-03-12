// Notification dispatcher — simulates email, SMS, and push notifications
import { notificationPrefs, notificationLog, users } from './store.js';

const MILESTONE_LABELS = {
  pickup: 'Shipment Picked Up',
  in_transit: 'Shipment In Transit',
  delayed: 'Shipment Delayed',
  awaiting_customs: 'Awaiting Customs',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  exception: 'Shipment Exception',
};

// Map unified status to milestone key
const STATUS_TO_MILESTONE = {
  in_transit: 'in_transit',
  delayed: 'delayed',
  awaiting_customs: 'awaiting_customs',
  out_for_delivery: 'out_for_delivery',
  delivered: 'delivered',
  exception: 'exception',
};

export function dispatchNotifications(shipment, event) {
  const milestone = STATUS_TO_MILESTONE[event.status];
  if (!milestone) return;

  // Notify all users who own this shipment
  for (const userId of shipment.ownedBy || []) {
    const user = [...users.values()].find(u => u.id === userId);
    if (!user) continue;

    const prefs = notificationPrefs.get(userId);
    if (!prefs || !prefs.milestones.includes(milestone)) continue;

    const channels = [];

    if (prefs.email) {
      channels.push('email');
      simulateEmail(user, shipment, event, milestone);
    }
    if (prefs.sms) {
      channels.push('sms');
      simulateSMS(user, shipment, event);
    }
    if (prefs.push) {
      channels.push('push');
      simulatePush(user, shipment, event);
    }

    if (channels.length > 0) {
      notificationLog.unshift({
        id: crypto.randomUUID(),
        userId,
        userName: user.name,
        shipmentId: shipment.id,
        trackingNumber: shipment.trackingNumber,
        carrier: shipment.carrier,
        milestone,
        label: MILESTONE_LABELS[milestone] || milestone,
        channels,
        timestamp: new Date().toISOString(),
        message: buildMessage(shipment, event),
      });
      // Keep log size manageable
      if (notificationLog.length > 200) notificationLog.pop();
    }
  }
}

function buildMessage(shipment, event) {
  return `Your shipment ${shipment.trackingNumber} (${shipment.description}) — ${event.description} at ${event.location}.`;
}

function simulateEmail(user, shipment, event, milestone) {
  console.log(`📧 EMAIL → ${user.email}: [ShipTrack] ${MILESTONE_LABELS[milestone]} — ${shipment.trackingNumber}`);
}

function simulateSMS(user, shipment, event) {
  console.log(`📱 SMS → ${user.name}: ShipTrack — ${shipment.trackingNumber}: ${event.description}`);
}

function simulatePush(user, shipment, event) {
  console.log(`🔔 PUSH → ${user.name}: ${event.description} — ${shipment.trackingNumber}`);
}
