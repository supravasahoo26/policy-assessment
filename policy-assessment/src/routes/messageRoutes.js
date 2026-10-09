const express = require('express');
const { ScheduledMessage } = require('../models');
const { schedule } = require('../services/scheduler');
const router = express.Router();

// POST /api/messages/schedule
// body: { message: "hello", day: "2026-10-10", time: "14:30" }
router.post('/schedule', async (req, res, next) => {
  try {
    const { message, day, time } = req.body;
    if (!message || !day || !time) return res.status(400).json({ message: 'message, day and time are required' });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !/^\d{2}:\d{2}$/.test(time)) {
      return res.status(400).json({ message: 'day must be YYYY-MM-DD and time must be HH:mm' });
    }

    const scheduledAt = new Date(`${day}T${time}:00`);
    if (Number.isNaN(scheduledAt.getTime())) return res.status(400).json({ message: 'Invalid date/time' });
    if (scheduledAt <= new Date()) return res.status(400).json({ message: 'Scheduled time must be in the future' });

    const item = await ScheduledMessage.create({ message, scheduledAt });
    schedule(item);
    res.status(201).json({ message: 'Message scheduled successfully', data: item });
  } catch (error) { next(error); }
});

router.get('/', async (req, res, next) => {
  try {
    const data = await ScheduledMessage.find().sort({ scheduledAt: 1 });
    res.json({ count: data.length, data });
  } catch (error) { next(error); }
});

module.exports = router;
