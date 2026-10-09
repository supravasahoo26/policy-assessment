const { ScheduledMessage } = require('../models');

const timers = new Map();

async function processMessage(id) {
  const item = await ScheduledMessage.findOneAndUpdate(
    { _id: id, status: 'scheduled' },
    { $set: { status: 'processed', processedAt: new Date() } },
    { new: true }
  );
  if (item) console.log(`Scheduled message processed: ${item.message}`);
  timers.delete(String(id));
}

function schedule(item) {
  const id = String(item._id);
  if (timers.has(id)) return;
  const delay = Math.max(0, new Date(item.scheduledAt).getTime() - Date.now());
  const timer = setTimeout(() => processMessage(item._id).catch(console.error), delay);
  timers.set(id, timer);
}

async function loadPendingSchedules() {
  const pending = await ScheduledMessage.find({ status: 'scheduled' });
  pending.forEach(schedule);
}

module.exports = { schedule, loadPendingSchedules };
