// Contract + invariant runner. Execute only trusted, locally authored model/test files.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const [modelFile,casesFile,outputFile]=process.argv.slice(2);
if(!modelFile||!casesFile)throw Error('Usage: node check_model.cjs model.js cases.cjs [report.json]');
const model=require(path.resolve(modelFile)),suite=require(path.resolve(casesFile));
let checks=0;const near=(a,b,tol=1e-8)=>{checks++;assert.ok(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=tol*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);};
const ok=(v,message)=>{checks++;assert.ok(v,message);};const groups=[],panelIds=new Set();
for(const c of suite.cases){
 const sim=model.create(c.params||{});ok(sim.duration>0&&Number.isFinite(sim.duration),'finite physical duration');
 ok(sim.events.every((e,i,a)=>Number.isFinite(e.t)&&e.t>=0&&e.t<=sim.duration&&(!i||e.t>=a[i-1].t)),'ordered events');
 ok(typeof model.lessonSteps==='function','model.lessonSteps required for state/process analysis');
 const steps=model.lessonSteps(sim),ids=new Set();
 ok(steps.length>=3&&steps.length%2===1,'alternating states and processes');
 for(const [i,r] of steps.entries()){
  ok(r.kind===(i%2?'process':'state'),'state/process order');ok(typeof r.id==='string'&&!ids.has(r.id),'unique step id');ids.add(r.id);
  for(const key of ['title','text','equation'])ok(typeof r[key]==='string'&&r[key].trim().length>0,'concrete step '+key);
  ok(Number.isFinite(r.start)&&Number.isFinite(r.end)&&r.start>=0&&r.end<=sim.duration,'step bounds');
  if(r.kind==='state')near(r.start,r.end);else{ok(r.end>r.start,'positive process interval');near(r.start,steps[i-1].start);near(r.end,steps[i+1].start);}
 }
 near(steps[0].start,0);near(steps.at(-1).end,sim.duration);
 const times=[...Array.from({length:201},(_,i)=>sim.duration*i/200),...sim.events.map(e=>e.t)];
 for(const t of times){const s=sim.state(t);for(const [key,v] of Object.entries(s))if(typeof v==='number')ok(Number.isFinite(v),'nonfinite state '+key);
  const visual=model.mechanism?.(sim,s)||{nodes:[],panels:[]};
  for(const n of visual.nodes){ok(Number.isFinite(n.value),'nonfinite law node '+n.id);ok(visual.panels.some(p=>p.node===n.id||visual.links?.[n.id]?.includes(p.id)),'unbound law node '+n.id);}
  for(const p of visual.panels){panelIds.add(p.id);if(p.type==='balance'){near(p.terms.reduce((a,b)=>a+b.value,0),p.total);ok(p.scale>0&&Number.isFinite(p.scale),'shared finite scale');}if(p.type==='energy')for(const row of p.rows)near(row.terms.reduce((a,b)=>a+b.value,0),p.total);}
  c.check?.(sim,s,{near,ok});
 }
 const t=sim.duration*.37,s=JSON.stringify(sim.state(t));sim.state(sim.duration);ok(JSON.stringify(sim.state(t))===s,'deterministic rewind');
 c.final?.(sim,{near,ok});groups.push(c.name);
}
suite.extra?.(model,{near,ok});
const lessonPath=path.join(path.dirname(path.resolve(modelFile)),'lesson.json');
if(fs.existsSync(lessonPath)){const lesson=JSON.parse(fs.readFileSync(lessonPath,'utf8'));for(const p of lesson.visualPlan||[])ok(['viewport','plots','stage-steps'].includes(p.target)||panelIds.has(p.target),'unknown visual-plan target: '+p.target);}
const report={status:'passed',checks,groups,scope:'Model, visual values and supplied invariants; human visual inspection still required.'};
if(outputFile)fs.writeFileSync(outputFile,JSON.stringify(report,null,2));console.log(JSON.stringify(report));
