require('dotenv').config();
const express = require('express');
const { connectDB } = require('./db');
const uploadRoutes = require('./routes/uploadRoutes');
const policyRoutes = require('./routes/policyRoutes');
const messageRoutes = require('./routes/messageRoutes');
const { startCpuMonitor } = require('./services/cpuMonitor');
const { loadPendingSchedules } = require('./services/scheduler');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => res.json({ status: 'UP', uptime: process.uptime() }));
app.use('/api/upload', uploadRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/messages', messageRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Internal server error' });
});

const PORT = Number(process.env.PORT || 3000);

(async () => {
  try {
    await connectDB();
    await loadPendingSchedules();
    startCpuMonitor();
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  } catch (error) {
    console.error('Startup failed:', error);
    process.exit(1);
  }
})();
