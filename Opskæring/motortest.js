#!/usr/bin/env node
// Testbænk for opskæringsmotoren i index.html — køres med Node, ingen
// afhængigheder:   node Opskæring/motortest.js [antal] [hurtig|normal|grundig]
//
// Trækker koden mellem "MOTOR START" og "MOTOR SLUT" ud af index.html,
// genererer realistiske tilfældige ordrer (faste seeds, så kørslen kan
// gentages) og tjekker for hver af dem, at den optimerede plan er fysisk
// gyldig (bredde, længde, maks strimler, dorn-grænser, min. restbredde,
// alle bånd talt med præcis én gang) og aldrig dårligere end
// grundberegningen. Til sidst vises, hvor meget optimeringen har vundet.
// Afslutter med kode 1, hvis noget fejler.
'use strict';
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const block = src.match(/\/\/ ---- MOTOR START ----[\s\S]*?\/\/ ---- MOTOR SLUT ----/);
if (!block) { console.error('Fandt ikke MOTOR START/SLUT i index.html'); process.exit(1); }
const M = {};
new Function('M', 'performance', 'const EPS = 1e-6;\n' + block[0] +
  '\nObject.assign(M, { optimerOpskaering, cmpMetrics, planMetrics, resetUid: () => { _uid = 0; } });')(M, globalThis.performance);

const EPS = 1e-6;
const N = Number(process.argv[2] || 60);
const niveau = process.argv[3] || 'hurtig';

function rnd(seed) {
  let a = seed >>> 0;
  return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];

function genCase(seed) {
  const r = rnd(seed);
  const rollW = pick(r, [800, 1000, 1200, 1250, 1400, 1500, 1600, 2000]);
  const rollL = pick(r, [15000, 20000, 25000, 30000, 50000, 60000, 100000]);
  const rolls = [];
  const nRows = r() < 0.6 ? 1 : (r() < 0.7 ? 2 : 3);
  for (let i = 0; i < nRows; i++) {
    const w = i === 0 ? rollW : pick(r, [rollW, 1000, 1250, 1500, 2000]);
    const l = i === 0 ? rollL : pick(r, [20000, 30000, 50000, 100000]);
    for (let k = 0, q = r() < 0.8 ? 1 : 2; k < q; k++) rolls.push({ w, len: l });
  }
  const maxW = Math.max(...rolls.map(x => x.w)), maxL = Math.max(...rolls.map(x => x.len));
  const buffer = pick(r, [0, 0, 100, 350]);
  const bands = [];
  for (let i = 0, n = 1 + Math.floor(r() * 8); i < n; i++) {
    const b = r() < 0.7 ? pick(r, [50, 60, 80, 100, 120, 150, 180, 200, 250, 300, 350, 400, 450, 500, 600, 650, 700, 800, 1000]) : 40 + Math.round(r() * 90) * 10;
    const l = r() < 0.5 ? pick(r, [1000, 1500, 2000, 2500, 3000, 4000, 5000, 6000, 7030, 8000, 10000, 12000]) : 500 + Math.round(r() * 120) * 100;
    if (b > maxW || l + buffer > maxL) continue;
    bands.push({ qty: r() < 0.4 ? 1 + Math.floor(r() * 3) : 1 + Math.floor(r() * 14), b, l });
  }
  if (!bands.length) bands.push({ qty: 2, b: 100, l: 3000 });
  const dornOn = r() < 0.3;
  return {
    rollDefs: rolls, bandRows: bands, buffer,
    dorn: { on: dornOn, tillaeg: dornOn ? pick(r, [0, 5, 10]) : 0, maxW: 700, maxL: 5500 },
    maxPerWidth: r() < 0.15 ? 1 + Math.floor(r() * 3) : null,
    minRestW: r() < 0.3 ? pick(r, [50, 100, 200]) : 0
  };
}

function check(c, plan) {
  const errs = [];
  const ids = new Set(), perSize = new Map();
  const count = b => { const k = b.b + 'x' + b.origL; perSize.set(k, (perSize.get(k) || 0) + 1); };
  for (const r of plan.rolls) {
    let sumLen = 0;
    for (const s of r.sections) {
      sumLen += s.len;
      let wsum = 0, x = 0;
      const wc = new Map();
      for (const col of s.cols) {
        if (Math.abs(col.x - x) > EPS) errs.push('strimmel-position passer ikke');
        x += col.w; wsum += col.w;
        wc.set(col.w, (wc.get(col.w) || 0) + 1);
        let f = 0;
        for (const u of col.items) {
          if (Math.abs(u.w - col.w) > EPS) errs.push('emne har anden bredde end strimlen');
          if (ids.has(u.id)) errs.push('emne placeret to gange');
          ids.add(u.id);
          f += u.len;
          u.bands.forEach(count);
          if (u.kind === 'dorn' && (u.w > c.dorn.maxW + EPS || u.origL > c.dorn.maxL + EPS)) errs.push('dorn over grænsen');
        }
        if (Math.abs(f - col.filled) > EPS || col.filled > s.len + EPS) errs.push('strimmel længere end rækken');
        if (Math.abs(col.rest - (s.len - col.filled)) > EPS) errs.push('længderest passer ikke');
      }
      if (wsum > r.w + EPS) errs.push('række bredere end rullen');
      if (Math.abs(s.sideRest - (r.w - wsum)) > EPS) errs.push('siderest passer ikke');
      if (c.maxPerWidth) for (const n of wc.values()) if (n > c.maxPerWidth) errs.push('maks strimler overskredet');
    }
    if (sumLen > r.len + EPS || Math.abs(sumLen - r.usedLen) > EPS) errs.push('rækker længere end rullen');
    if (r.langRest && c.minRestW && r.langRest.w < c.minRestW - EPS) errs.push('rest smallere end min. restbredde');
  }
  for (const u of plan.leftovers) u.bands.forEach(count);
  const want = new Map();
  for (const r of c.bandRows) want.set(r.b + 'x' + r.l, (want.get(r.b + 'x' + r.l) || 0) + r.qty);
  for (const [k, n] of want) if (perSize.get(k) !== n) errs.push('antal bånd passer ikke for ' + k);
  return [...new Set(errs)];
}

let bad = 0, worse = 0, better = 0, fewerLost = 0, wBase = 0, wBest = 0, tSum = 0, tMax = 0;
for (let i = 0; i < N; i++) {
  const c = genCase(20260924 + i);
  M.resetUid();
  const gen = M.optimerOpskaering({ ...c, niveau });
  let res;
  for (;;) { const s = gen.next(); if (s.done) { res = s.value; break; } }
  const errs = check(c, res.plan);
  if (errs.length) { bad++; console.log(`#${i}: ${errs.join('; ')}\n   ${JSON.stringify(c)}`); }
  const d = M.cmpMetrics(res.metrics, res.baseMetrics);
  if (d > 0) { worse++; console.log(`#${i}: optimeret plan er dårligere end grundberegningen`); }
  if (d < 0) better++;
  if (res.metrics.lost < res.baseMetrics.lost) fewerLost++;
  if (res.metrics.lost === res.baseMetrics.lost && res.metrics.rolls === res.baseMetrics.rolls) { wBase += res.baseMetrics.waste; wBest += res.metrics.waste; }
  tSum += res.ms; tMax = Math.max(tMax, res.ms);
}
const m2 = a => (a / 1e6).toFixed(1) + ' m²';
console.log(`${N} ordrer (${niveau}): ${N - bad} gyldige planer, ${worse} dårligere end grundberegningen, ${better} forbedret, ${fewerLost} med flere bånd placeret.`);
console.log(`Spild (hvor antal ruller/manglende bånd er ens): ${m2(wBase)} → ${m2(wBest)} (${wBase ? (100 * (1 - wBest / wBase)).toFixed(1) : 0} % mindre). Tid: gns. ${(tSum / N).toFixed(0)} ms, maks ${tMax.toFixed(0)} ms.`);
process.exit(bad || worse ? 1 : 0);
