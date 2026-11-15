// Posts simulated wearable readings: node simulate.js
const ids = ['CM-001', 'CM-002', 'CM-003', 'CM-004'];
setInterval(async () => {
  const crewId = ids[Math.floor(Math.random() * ids.length)];
  const body = { crewId, hr: 60 + Math.random() * 35, sleepH: 4 + Math.random() * 4, stress: 20 + Math.random() * 50, spo2: 93 + Math.random() * 6 };
  Object.keys(body).forEach((k) => k !== 'crewId' && (body[k] = +body[k].toFixed(1)));
  const r = await fetch('http://localhost:8787/api/vitals', { method: 'POST', headers: { 'content-type': 'application/json', 'x-device-key': process.env.DEVICE_KEY || 'dev-device-key' }, body: JSON.stringify(body) });
  console.log(crewId, r.status, (await r.json()).level);
}, 3000);
