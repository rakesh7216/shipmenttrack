import express from 'express';
import { shipments } from '../store.js';

const router = express.Router();

const STATUS_MSGS = {
  in_transit: 'is currently in transit.',
  out_for_delivery: 'is out for delivery today!',
  delivered: 'has been successfully delivered.',
  delayed: 'is experiencing a slight delay.',
  awaiting_customs: 'is awaiting customs clearance.',
  exception: 'has an exception issue. Please contact support.'
};

function formatETA(iso) {
  if (!iso) return 'No ETA available';
  const d = new Date(iso);
  const now = new Date();
  const diffH = (d - now) / 3600000;
  if (diffH < 0) return 'Past due';
  if (diffH < 1) return `in about ${Math.round(diffH * 60)} minutes`;
  if (diffH < 24) return `in approximately ${Math.round(diffH)} hours`;
  return `on ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

router.post('/', (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.json({ reply: "Hi there! I'm the ShipTrack assistant. How can I help you today?" });
  }

  // Look for a tracking number pattern (e.g., TRK-1234567, or any 8-15 char uppercase alphanumeric)
  const text = message.toUpperCase();
  const trackingMatches = text.match(/[A-Z0-9-]{8,15}/g);
  
  if (trackingMatches) {
    for (const tn of trackingMatches) {
      const ship = [...shipments.values()].find(s => s.trackingNumber.toUpperCase() === tn || s.id.toUpperCase() === tn);
      
      if (ship) {
        const dest = ship.destination?.name || 'its destination';
        const msg = `Shipment **${ship.trackingNumber}** to ${dest} ${STATUS_MSGS[ship.status] || 'is being processed.'} \n\nEstimated delivery: **${formatETA(ship.estimatedDelivery)}**`;
        return res.json({ reply: msg });
      }
    }
  }

  // Handle some common intents if no tracking number is found
  if (text.includes('HELLO') || text.includes('HI')) {
    return res.json({ reply: "Hello! I can help track your shipments. Just provide a tracking number!" });
  }
  
  if (text.includes('HELP')) {
    return res.json({ reply: "I'm the ShipTrack AI assistant. You can ask me to track a specific package by pasting the tracking number (e.g., TRK-1234567)." });
  }

  // Fallback
  return res.json({ reply: "I couldn't find a recognized tracking number in your message. If you need an update, please provide the exact tracking ID." });
});

export default router;
