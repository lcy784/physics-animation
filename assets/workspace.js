(function(root){
 'use strict';
 const $=id=>document.getElementById(id),ui=root.physicsUI,model=root.PHYSICS_MODEL;
 const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;};
 const main=document.querySelector('main'),old=document.querySelector('.workspace');
 const scene=document.querySelector('.scene-panel'),params=document.querySelector('.controls'),plots=$('plots');
 const reading=document.querySelector('.reading'),explanation=document.querySelector('.explanation');
 const shell=node('div','studio');shell.id='studio';
 const nav=node('nav','panel-nav');nav.setAttribute('aria-label','显示功能分区');
 const body=node('div','studio-body'),left=node('aside','stage-sidebar card'),center=node('div','studio-center');left.id='stage-panel';params.id='parameter-panel';
 left.append(node('h2','','各阶段分析'));
 const mode=node('select');mode.id='stage-mode';mode.setAttribute('aria-label','阶段展示方式');mode.add(new Option('跟随时间线','follow'));mode.add(new Option('手动自由查看','manual'));left.append(mode,node('p','small-note','状态给出条件，过程解释规律。点击“定位”可跳到对应时刻。'));
 const steps=node('div');steps.id='stage-steps';left.append(steps);
 const live=node('details','live-analysis');live.open=true;live.append(node('summary','','当前时刻的量与公式'),explanation);left.append(live);
 const plotPanel=node('section','plot-dock card');plotPanel.id='plot-panel';plotPanel.append(node('h2','','曲线图像'),plots);
 const transport=node('section','transport-dock card');transport.id='transport-panel';transport.append(node('h2','','操作按钮 · 时间线'));
 for(const n of [scene.querySelector('.transport'),$('timeline'),$('events'),scene.querySelector('.event-tools')])transport.append(n);
 const marks=node('div','time-map');marks.id='time-map';transport.querySelector('#timeline').before(marks);
 reading.id='reading-panel';center.append(scene,plotPanel,reading);body.append(left,center,params);shell.append(nav,body,transport);
 old.remove();main.replaceChildren(shell);
 const modelTitle=node('h2','','物理模型');scene.prepend(modelTitle);
 const sceneInfo=node('details','scene-info');sceneInfo.append(node('summary','','场景方向、比例与使用说明'));$('scene-note').before(sceneInfo);sceneInfo.append($('scene-note'));
 const eventInfo=node('details','event-info');eventInfo.append(node('summary','','关键时刻列表与慢放设置'));transport.append(eventInfo);eventInfo.append($('events'),transport.querySelector('.event-tools'));
 const panels=[['stage-panel','阶段分析','left-closed'],['parameter-panel','改变条件','right-closed'],['plot-panel','曲线图像','plots-closed'],['reading-panel','完整推导','reading-closed'],['transport-panel','操作区','transport-closed']];
 function setPanel(id,cls,open){$(id).hidden=!open;shell.classList.toggle(cls,!open);nav.querySelector('[data-panel="'+id+'"]').setAttribute('aria-expanded',String(open));}
 for(const [id,label,cls] of panels){const b=node('button','',label);b.dataset.panel=id;b.setAttribute('aria-controls',id);b.setAttribute('aria-expanded','true');b.onclick=()=>setPanel(id,cls,$(id).hidden);nav.append(b);}
 const focus=node('button','','专注模型');focus.id='focus-model';focus.setAttribute('aria-pressed','false');nav.append(focus);let saved=null;
 focus.onclick=()=>{if(saved){for(const [id,,cls] of panels)setPanel(id,cls,saved[id]);saved=null;}else{saved=Object.fromEntries(panels.map(([id])=>[id,!$(id).hidden]));for(const [id,,cls] of panels)setPanel(id,cls,false);}focus.textContent=saved?'恢复布局':'专注模型';focus.setAttribute('aria-pressed',String(!!saved));};
 let rows=[],cards=[],active=-1;
 const f=n=>Number(n.toPrecision(4)).toString();
 function rebuild(){
  const sim=ui.sim;rows=model.lessonSteps?model.lessonSteps(sim):[];
  if(!rows.length){ // Older models remain usable; authors must replace with topic-specific analysis.
   sim.events.forEach((e,i)=>{const p=model.present(sim,sim.state(e.t));rows.push({id:'state-'+i,kind:'state',start:e.t,end:e.t,title:e.label,text:p.text,equation:p.equation});if(i<sim.events.length-1){const end=sim.events[i+1].t,mid=(e.t+end)/2,q=model.present(sim,sim.state(mid));rows.push({id:'process-'+i,kind:'process',start:e.t,end,title:q.heading,text:q.text,equation:q.equation});}});
  }
  steps.replaceChildren();marks.replaceChildren();cards=[];active=-1;
  let stateIndex=0,processIndex=0;
  for(const r of rows){
   const prefix=r.kind==='state'?'状态 '+stateIndex++:'过程 '+ ++processIndex;
   const card=node('details','stage-card '+r.kind);card.dataset.step=r.id;const sum=node('summary','',prefix+' · '+r.title);card.append(sum);
   const time=node('small','step-time',f(r.start)+(r.kind==='process'?' — '+f(r.end):'')+' s'),text=node('p','',r.text),eq=node('div','equation',r.equation),jump=node('button','','定位'+prefix);
   jump.onclick=()=>ui.jump(r.kind==='state'?r.start:(r.start+r.end)/2);card.append(time,text,eq,jump);steps.append(card);cards.push(card);
   sum.addEventListener('click',()=>{mode.value='manual';for(const c of cards)c.hidden=false;});
   const mark=node('button',r.kind==='state'?'time-state':'time-process',r.kind==='state'?String(stateIndex-1):'过程 '+processIndex);mark.dataset.step=r.id;mark.setAttribute('aria-label',prefix+'：'+r.title+'，'+time.textContent);mark.title=prefix+' · '+r.title+' ('+time.textContent+')';
   if(r.kind==='state')mark.style.left=(100*r.start/sim.duration)+'%';else{mark.style.left=(100*r.start/sim.duration)+'%';mark.style.width=(100*(r.end-r.start)/sim.duration)+'%';}
   mark.onclick=()=>ui.jump(r.kind==='state'?r.start:(r.start+r.end)/2);marks.append(mark);
  }
  update();
 }
 function update(){
  const t=ui.time,eps=ui.sim.duration*1e-7;
  let index=rows.findIndex(r=>r.kind==='state'&&Math.abs(t-r.start)<=eps);if(index<0)index=rows.findIndex(r=>r.kind==='process'&&t>r.start&&t<r.end);if(index<0)index=rows.length-1;
  cards.forEach((card,i)=>{const current=i===index;card.classList.toggle('current',current);card.setAttribute('aria-current',current?'step':'false');if(mode.value==='follow'){card.hidden=i>index;card.open=current; }else card.hidden=false;});
  marks.querySelectorAll('button').forEach((b,i)=>b.classList.toggle('current',i===index));
  if(index!==active&&mode.value==='follow'&&!left.hidden){const c=cards[index];if(c)left.scrollTop=Math.max(0,c.offsetTop-left.offsetTop-100);}active=index;
 }
 mode.onchange=()=>{if(mode.value==='manual')cards.forEach(c=>{c.hidden=false;c.open=true;});update();};
 root.addEventListener('physics:time',update);root.addEventListener('physics:rebuild',rebuild);rebuild();
 root.physicsWorkspace={get steps(){return rows;},get active(){return rows[active]?.id;}};
})(globalThis);
