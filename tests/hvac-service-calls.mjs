import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync('games/hvac-service-calls/model.js','utf8'),ctx);const M=ctx.HVACModel;
for(const t of M.templates){const job={fault:t.id,customer:'Sam',place:'Garden cottage',color:'#e6bd91'};const steps=M.steps(job);assert.equal(steps.length,14);assert.equal(steps[2].effect,'off');assert.equal(steps[11].effect,'on');assert.equal(steps[12].effect,'tested');assert.equal(steps[13].effect,'thanks');assert.equal(new Set(steps.map(s=>s.label)).size,14);assert(M.valid({version:1,target:6,completed:[],job,step:14}));for(let i=0;i<100;i++)assert.notEqual(M.createJob(t.id).fault,t.id);}
assert.equal(M.createJob(null,true).fault,'filter');for(const bad of [null,{}, {version:2}, {version:1,target:6,completed:[],job:{fault:'bad'},step:0}])assert(!M.valid(bad));console.log('PASS five coherent 14-step calls, preparation/test ordering, first filter, no immediate repeat, saved state validation');
