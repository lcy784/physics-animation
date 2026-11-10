(function(root){
  'use strict';
  const model=root.PHYSICS_MODEL, lesson=root.LESSON, $=id=>document.getElementById(id);
  const fmt=n=>Number.isFinite(n)?Math.abs(n)<1e-9?'0':Math.abs(n)>=1e5||Math.abs(n)<.001?n.toExponential(3):Number(n.toPrecision(5)).toString():'—';
  $('title').textContent=lesson.title;$('subtitle').textContent=lesson.subtitle||'';$('source').textContent=lesson.source||'';
  $('scene-note').textContent=lesson.sceneNote||'拖动旋转 · 滚轮缩放 · 右键平移';
  for(const [id,key] of [['model-reading','modelHtml'],['solution','solutionHtml'],['limitations','limitationsHtml']])$(id).innerHTML=lesson[key]||'';
  let params={...model.defaults},sim,sceneAdapter,kit,playing=false,t=0,last=0,plotCache=[],controls=[],eventAnchor=0;
  try{kit=root.PHYSICS_SCENE_KIT.makeKit($('viewport'));}catch(e){$('render-error').hidden=false;$('render-error').textContent='三维显示初始化失败：需要支持 WebGL 2 的浏览器。模型数值与时间线仍可使用。';console.error(e);}
  const vectorControls=root.PHYSICS_VECTOR_CONTROLS.mount($('vector-options'),kit);
  const labelControls=root.PHYSICS_LABEL_CONTROLS.mount($('label-options'),kit);
  function pause(){playing=false;$('play').textContent='播放';}
  function setParam(key,value){
    const next={...params,[key]:value};
    try{const candidate=model.create(next);params=next;rebuild(candidate);$('input-error').textContent='';}
    catch(e){pause();$('input-error').textContent=e.message+'；保留上一次有效模型。';}
  }
  for(const p of model.parameters){
    const row=document.createElement('div');row.className='parameter';row.dataset.key=p.key;
    const top=document.createElement('div');top.className='parameter-top';const label=document.createElement('label');label.textContent=p.label;label.htmlFor='param-'+p.key;top.append(label);row.append(top);
    if(p.options){const select=document.createElement('select');select.id='param-'+p.key;for(const [v,l] of p.options){const o=new Option(l,v);select.add(o);}select.addEventListener('change',()=>setParam(p.key,Number(select.value)));row.append(select);controls.push({p,row,select});}
    else{const wrap=document.createElement('span');const num=document.createElement('input');num.id='param-'+p.key;num.type='number';num.min=p.min;num.max=p.max;num.step='any';num.setAttribute('aria-label',p.label);const unit=document.createElement('small');unit.textContent=' '+(p.unit||'');wrap.append(num,unit);top.append(wrap);const slider=document.createElement('input');slider.type='range';slider.min=p.min;slider.max=p.max;slider.step=p.step;slider.setAttribute('aria-label',p.label+'滑块');row.append(slider);num.addEventListener('change',()=>setParam(p.key,num.value===''?NaN:Number(num.value)));slider.addEventListener('input',()=>setParam(p.key,Number(slider.value)));controls.push({p,row,num,slider});}
    $('parameters').append(row);
  }
  for(const preset of model.presets||[]){const b=document.createElement('button');b.textContent=preset.label;b.addEventListener('click',()=>{const next={...params,...preset.values};try{const candidate=model.create(next);params=next;rebuild(candidate);$('input-error').textContent='';}catch(e){$('input-error').textContent=e.message;}});$('presets').append(b);}
  function buildPlots(){
    $('plots').replaceChildren();plotCache=[];
    for(const spec of sim.plots||[]){
      const card=document.createElement('div');card.className='card plot';const title=document.createElement('h3');title.textContent=spec.title;const canvas=document.createElement('canvas');canvas.setAttribute('aria-label',spec.title);const legend=document.createElement('div');legend.className='legend';
      for(const s of spec.series){const item=document.createElement('span'),mark=document.createElement('i');mark.style.background=s.color;item.append(mark,document.createTextNode(s.label));legend.append(item);}card.append(title,canvas,legend);$('plots').append(card);
      const times=new Set(Array.from({length:401},(_,i)=>sim.duration*i/400));for(const e of sim.events)times.add(e.t);
      const samples=[];for(const tt of [...times].sort((a,b)=>a-b)){if(spec.discontinuous&&tt>0&&sim.events.some(e=>e.t===tt)){samples.push({...sim.state(tt,'left'),breakBefore:false});samples.push({...sim.state(tt),breakBefore:true});}else samples.push(sim.state(tt));}
      plotCache.push({spec,canvas,samples});
    }
  }
  function rebuild(candidate){
    pause();t=0;eventAnchor=0;sim=candidate||model.create(params);
    for(const c of controls){c.row.hidden=c.p.mode!==undefined&&c.p.mode!==params.mode;if(c.select)c.select.value=params[c.p.key];else{c.num.value=Number(params[c.p.key].toPrecision(8));c.slider.value=params[c.p.key];}}
    if(kit){kit.clear();sceneAdapter=root.PHYSICS_SCENE.build(sim,kit);vectorControls.refresh();labelControls.refresh();}
    $('timeline').max=sim.duration;$('timeline').step=sim.duration/100000;
    $('events').replaceChildren();for(const e of sim.events){const b=document.createElement('button');b.textContent=e.label;b.title=fmt(e.t)+' s';b.dataset.time=e.t;b.addEventListener('click',()=>{pause();eventAnchor=e.t;seek(e.t);});$('events').append(b);}
    buildPlots();seek(0);root.dispatchEvent(new Event('physics:rebuild'));
  }
  function drawPlot(plot,state){
    const {canvas,spec,samples}=plot;const rect=canvas.getBoundingClientRect();if(rect.width<1)return;
    const dpr=Math.min(devicePixelRatio,2),W=rect.width,H=Math.max(120,rect.height);if(canvas.width!==Math.round(W*dpr)||canvas.height!==Math.round(H*dpr)){canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);}
    const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);
    const left=48,right=14,top=16,bottom=30,xKey=spec.xKey||'t';const xmax=samples.at(-1)[xKey]||1;
    const ys=samples.flatMap(s=>spec.series.map(q=>s[q.key]));let ymin=Math.min(0,...ys),ymax=Math.max(0,...ys);if(ymax-ymin<1e-10){ymax=1;ymin=-1;}const pad=(ymax-ymin)*.12;ymin-=pad;ymax+=pad;
    const px=x=>left+x/xmax*(W-left-right),py=y=>H-bottom-(y-ymin)/(ymax-ymin)*(H-bottom-top);
    ctx.font='11px Segoe UI, Microsoft YaHei';ctx.fillStyle='#6b7e7b';ctx.lineWidth=1;
    for(let i=0;i<=4;i++){const y=ymin+(ymax-ymin)*i/4;ctx.strokeStyle='#e5ebe4';ctx.beginPath();ctx.moveTo(left,py(y));ctx.lineTo(W-right,py(y));ctx.stroke();ctx.textAlign='right';ctx.fillText(Number(y.toPrecision(3)).toString(),left-7,py(y)+4);const x=xmax*i/4;ctx.textAlign='center';ctx.fillText(Number(x.toPrecision(3)).toString(),px(x),H-10);}
    ctx.save();ctx.beginPath();ctx.rect(left,top,W-left-right,H-top-bottom);ctx.clip();
    for(const q of spec.series){ctx.strokeStyle=q.color;ctx.lineWidth=2;ctx.beginPath();samples.forEach((s,i)=>{if(i===0||s.breakBefore)ctx.moveTo(px(s[xKey]),py(s[q.key]));else ctx.lineTo(px(s[xKey]),py(s[q.key]));});ctx.stroke();}
    ctx.strokeStyle='#1f514d';ctx.lineWidth=1;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(px(state[xKey]),top);ctx.lineTo(px(state[xKey]),H-bottom);ctx.stroke();ctx.setLineDash([]);
    for(const q of spec.series){ctx.fillStyle=q.color;ctx.beginPath();ctx.arc(px(state[xKey]),py(state[q.key]),4,0,Math.PI*2);ctx.fill();}ctx.restore();
  }
  function seek(time){
    t=Math.max(0,Math.min(sim.duration,time));const s=sim.state(t),p=model.present(sim,s);$('timeline').value=t;$('clock').textContent='t = '+fmt(t)+' s';$('phase').textContent=p.heading;$('explanation-title').textContent=p.heading;$('explanation-text').textContent=p.text;$('equation').textContent=p.equation;$('mode-note').textContent=p.note;
    const makeValue=([label,value,unit],result)=>{const el=document.createElement('div');el.className=result?'result':'value';const name=document.createElement('span');name.textContent=label;const strong=document.createElement('strong');strong.textContent=fmt(value);const small=document.createElement('small');small.textContent=' '+unit;strong.append(small);el.append(name,strong);return el;};
    $('values').replaceChildren(...p.values.map(x=>makeValue(x,false)));$('results').replaceChildren(...p.results.map(x=>makeValue(x,true)));
    const current=sim.events.filter(e=>e.t<=t+1e-12).at(-1);for(const b of $('events').children)b.classList.toggle('active',Number(b.dataset.time)===current?.t);
    sceneAdapter?.update(s);
    const slow=$('auto-slow').checked?(sim.playbackScale?.(t)||1):1;$('effective-speed').textContent='当前播放倍率 '+fmt(Number($('speed').value)*slow)+'×';
    for(const plot of plotCache)drawPlot(plot,s);kit?.render();root.dispatchEvent(new Event('physics:time'));
  }
  $('timeline').addEventListener('input',()=>{pause();seek(Number($('timeline').value));});
  $('play').addEventListener('click',()=>{if(playing)pause();else{if(t>=sim.duration)seek(0);playing=true;$('play').textContent='暂停';last=performance.now();}});
  $('restart').addEventListener('click',()=>{pause();seek(0);});
  $('before-event').addEventListener('click',()=>{pause();seek(eventAnchor-sim.duration*1e-6);});
  $('after-event').addEventListener('click',()=>{pause();seek(eventAnchor+sim.duration*1e-6);});
  for(const id of ['auto-slow','speed'])$(id).addEventListener('change',()=>seek(t));
  $('reset').addEventListener('click',()=>{params={...model.defaults};$('input-error').textContent='';rebuild();});
  for(const b of document.querySelectorAll('[data-view]'))b.addEventListener('click',()=>kit?.view(b.dataset.view));$('view-reset').addEventListener('click',()=>kit?.view('front'));
  let redraw=false;new ResizeObserver(()=>{redraw=true;}).observe($('plots'));
  function loop(now){
    if(playing){const slow=$('auto-slow').checked?(sim.playbackScale?.(t)||1):1;let next=Math.min(sim.duration,t+Math.min((now-last)/1000,.1)*Number($('speed').value)*slow);if($('guided').checked){const event=sim.events.find(e=>e.t>t+1e-9&&e.t<=next);if(event){next=event.t;eventAnchor=event.t;pause();}}seek(next);if(t>=sim.duration)pause();}
    else if(redraw){for(const plot of plotCache)drawPlot(plot,sim.state(t));redraw=false;}
    last=now;kit?.render();requestAnimationFrame(loop);
  }
  root.physicsUI={pause,seek,kit,get params(){return {...params};},get sim(){return sim;},get time(){return t;},restore(next,time){const candidate=model.create(next);params={...next};rebuild(candidate);seek(time);},jump(time){pause();eventAnchor=time;seek(time);}};
  rebuild();requestAnimationFrame(loop);
  // Read-only diagnostics for validation; the UI remains the user interaction surface.
  root.physicsDebug={get params(){return{...params};},get sim(){return sim;},get time(){return t;},get state(){return sim.state(t);},get labels(){return kit?.listLabels()||[];},get vectors(){return kit?.listVectors()||[];},get playing(){return playing;},get camera(){return kit?.camera.position.toArray();},get renderInfo(){return kit?.renderer.info.render;}};
})(globalThis);
