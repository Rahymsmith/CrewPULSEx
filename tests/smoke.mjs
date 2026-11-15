import assert from "node:assert/strict";

const response = await fetch("http://localhost:8787/api/health");
assert.equal(response.status, 200);
const health = await response.json();
assert.equal(health.product, "CrewPULSE X");

const invalid = await fetch("http://localhost:8787/api/risk/forecast", {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sleepHours: 99 })
});
assert.equal(invalid.status, 400);

const valid = await fetch("http://localhost:8787/api/risk/forecast", {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ member: "Demo crew", sleepHours: 6, workload: 7, fatigue: 5, stress: 55, cohesion: 70, heuristicScore: 48 })
});
assert.equal(valid.status, 200);
const result = await valid.json();
assert.match(result.text, /synthetic demonstration inputs/i);
console.log("CrewPULSE API smoke checks passed.");