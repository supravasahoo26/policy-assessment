const os = require('os');

function cpuSnapshot() {
  const cpus = os.cpus();
  let idle = 0, total = 0;
  for (const cpu of cpus) {
    const times = cpu.times;
    idle += times.idle;
    total += times.user + times.nice + times.sys + times.idle + times.irq;
  }
  return { idle, total };
}

function startCpuMonitor() {
  const threshold = Number(process.env.CPU_THRESHOLD || 70);
  const intervalMs = Number(process.env.CPU_CHECK_INTERVAL_MS || 5000);
  let previous = cpuSnapshot();

  const timer = setInterval(() => {
    const current = cpuSnapshot();
    const idleDelta = current.idle - previous.idle;
    const totalDelta = current.total - previous.total;
    const usage = totalDelta === 0 ? 0 : 100 * (1 - idleDelta / totalDelta);
    previous = current;
    console.log(`CPU usage: ${usage.toFixed(2)}%`);

    if (usage >= threshold) {
      console.error(`CPU usage exceeded ${threshold}%. Restarting server...`);
      // In production run under PM2/Docker/Kubernetes so the process is automatically restarted.
      clearInterval(timer);
      process.exit(1);
    }
  }, intervalMs);
  return timer;
}

module.exports = { startCpuMonitor };
