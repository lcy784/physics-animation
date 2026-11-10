/* Screen-space, frozen-frame ink. No external runtime dependency. */
(function(root){
 'use strict';
 const ui=root.physicsUI,$=id=>document.getElementById(id),host=$('viewport');
 const key='physics-ink-v3:'+root.LESSON.title,policyKey=key+':retain';
 const toolbar=document.createElement('div');toolbar.className='ink-toolbar';
 toolbar.innerHTML='<strong>暂停批注</strong><button id="ink-pen" aria-pressed="false">画笔</button><button id="ink-eraser" aria-pressed="false">橡皮擦</button><button id="ink-exit">返回模型</button><input id="ink-color" type="color" value="#d24b3e" aria-label="画笔颜色"><input id="ink-width" type="range" min="1" max="12" value="3" aria-label="画笔粗细"><button id="ink-undo">撤销</button><button id="ink-redo">重做</button><button id="ink-clear">清空本帧</button><select id="ink-records" class="ink-records" aria-label="已存批注帧"><option value="">选择已存批注帧</option></select><button id="ink-delete">删除本帧</button><button id="ink-clear-all">清空全部批注</button><label><input id="ink-retain" type="checkbox" checked> 退出后保留批注</label><button id="ink-export">导出批注</button><label>导入<input id="ink-import" class="ink-file" type="file" accept="application/json,.json"></label><span class="ink-note">在模型画面上书写；批注时锁定暂停帧与视角。取消“退出后保留”后仅本次打开可用。导出可备份到文件。</span>';
 document.querySelector('.scene-panel').append(toolbar);
 const advanced=document.createElement('details');advanced.className='ink-advanced';const summary=document.createElement('summary');summary.textContent='批注帧、保存与导入导出';advanced.append(summary);const extras=document.createElement('div');extras.className='ink-extras';advanced.append(extras);
 const remaining=[...toolbar.children].slice(8);for(const n of remaining)extras.append(n);toolbar.append(advanced);
 const status=document.createElement('p');status.className='ink-status';status.id='ink-status';status.setAttribute('role','status');toolbar.after(status);
 const surface=document.createElement('div');surface.className='ink-surface';surface.hidden=true;const sheet=document.createElement('div');sheet.className='ink-sheet';const img=new Image(),canvas=document.createElement('canvas');canvas.id='ink-canvas';canvas.setAttribute('aria-label','暂停帧批注画布');sheet.append(img,canvas);surface.append(sheet);host.append(surface);
 let records=[],current=null,mode=null,stroke=null,pointer=null,redo=[],dirty=false,restoring=false;
 const fmt=n=>Number(n.toPrecision(5));
 function say(s){status.textContent=s;}
 function validate(data){
  if(data?.version!==3||data.lesson!==root.LESSON.title||!Array.isArray(data.frames)||data.frames.length>60)throw Error('批注文件与本题不匹配，或帧数超过 60。');
  const ids=new Set();for(const r of data.frames){
   if(typeof r.id!=='string'||ids.has(r.id)||!Number.isFinite(r.time)||!Number.isFinite(r.width)||!Number.isFinite(r.height)||r.width<=0||r.height<=0||r.width>8192||r.height>8192||!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(r.image)||!Array.isArray(r.strokes)||r.strokes.length>10000)throw Error('批注数据无效。');
   ids.add(r.id);if(!r.params||typeof r.params!=='object'||Array.isArray(r.params)||Object.keys(root.PHYSICS_MODEL.defaults).some(k=>!Number.isFinite(r.params[k])))throw Error('批注缺少完整有效的模型参数。');const sim=root.PHYSICS_MODEL.create(r.params);if(r.time<0||r.time>sim.duration+1e-8)throw Error('批注时间超出模型范围。');
   for(const s of r.strokes){if(!['pen','eraser'].includes(s.tool)||!/^#[0-9a-f]{6}$/i.test(s.color)||!Number.isFinite(s.width)||s.width<=0||s.width>1||!Array.isArray(s.points)||s.points.length>50000||s.points.some(p=>!Array.isArray(p)||p.length!==2||p.some(v=>!Number.isFinite(v)||v<0||v>1)))throw Error('笔迹数据无效。');}
  }return data.frames;
 }
 function pack(){return {version:3,lesson:root.LESSON.title,frames:records};}
 function list(){const sel=$('ink-records'),value=current?.id||'';sel.replaceChildren(new Option('选择已存批注帧',''));for(const r of records)sel.add(new Option('t = '+fmt(r.time)+' s · '+r.strokes.length+' 笔',r.id));sel.value=value;}
 function persist(){
  list();try{localStorage.setItem(policyKey,$('ink-retain').checked?'1':'0');if($('ink-retain').checked){localStorage.setItem(key,JSON.stringify(pack()));dirty=false;say('批注已保存到此浏览器 · '+records.length+' 帧。');}else{localStorage.removeItem(key);dirty=false;say('批注仅在本次打开保留；关闭后清空。需要备份可先导出。');}}
  catch(e){dirty=true;say('浏览器未能保存批注，请使用“导出批注”备份。当前笔迹仍在。');}
 }
 try{const policy=localStorage.getItem(policyKey);$('ink-retain').checked=policy!=='0';const raw=localStorage.getItem(key);if(raw&&$('ink-retain').checked)records=validate(JSON.parse(raw));say(records.length?'已恢复 '+records.length+' 帧批注，请从列表选择。':'选择画笔即可暂停并批注当前帧。');}catch(e){say('本地批注未能读取：'+e.message+' 可导入之前导出的备份。');}
 function bounds(){if(!current)return;const scale=Math.min(host.clientWidth/current.width,host.clientHeight/current.height);sheet.style.width=current.width*scale+'px';sheet.style.height=current.height*scale+'px';canvas.width=Math.round(current.width);canvas.height=Math.round(current.height);draw();}
 function draw(){
  const c=canvas.getContext('2d');c.clearRect(0,0,canvas.width,canvas.height);if(!current)return;
  for(const s of [...current.strokes,...(stroke?[stroke]:[])]){if(!s.points.length)continue;c.globalCompositeOperation=s.tool==='eraser'?'destination-out':'source-over';c.strokeStyle=s.color;c.fillStyle=s.color;c.lineWidth=s.width*canvas.width;c.lineCap='round';c.lineJoin='round';c.beginPath();s.points.forEach((p,i)=>i?c.lineTo(p[0]*canvas.width,p[1]*canvas.height):c.moveTo(p[0]*canvas.width,p[1]*canvas.height));if(s.points.length===1){c.arc(s.points[0][0]*canvas.width,s.points[0][1]*canvas.height,c.lineWidth/2,0,Math.PI*2);c.fill();}else c.stroke();}c.globalCompositeOperation='source-over';
  $('ink-undo').disabled=!current.strokes.length;$('ink-redo').disabled=!redo.length;
 }
 function finish(){if(stroke){current.strokes.push(stroke);stroke=null;redo=[];persist();draw();}pointer=null;}
 function setTool(tool){mode=tool;$('ink-pen').setAttribute('aria-pressed',String(tool==='pen'));$('ink-eraser').setAttribute('aria-pressed',String(tool==='eraser'));canvas.style.cursor=tool==='eraser'?'cell':'crosshair';}
 function enter(tool){
  if(!ui.kit){say('当前浏览器未能显示三维模型，无法批注模型帧。');return;}
  ui.pause();if(!current){if(records.length>=60){say('已有 60 帧，请先导出并删除不需要的帧。');return;}
   ui.kit.render();const source=ui.kit.renderer.domElement;
   current={id:Date.now().toString(36)+'-'+Math.random().toString(36).slice(2),time:ui.time,params:ui.params,width:source.width,height:source.height,image:source.toDataURL('image/png'),strokes:[]};records.push(current);img.src=current.image;redo=[];
  }
  ui.kit.controls.enabled=false;surface.hidden=false;setTool(tool);bounds();persist();
 }
 function exit(){finish();surface.hidden=true;if(ui.kit)ui.kit.controls.enabled=true;setTool(null);current=null;redo=[];list();}
 function restore(r){exit();restoring=true;try{ui.restore(r.params,r.time);current=r;img.src=r.image;surface.hidden=false;if(ui.kit)ui.kit.controls.enabled=false;setTool('pen');bounds();list();say('已恢复 t = '+fmt(r.time)+' s 的暂停画面与批注。点击“返回模型”继续操作。');}finally{restoring=false;}}
 $('ink-pen').onclick=()=>enter('pen');$('ink-eraser').onclick=()=>enter('eraser');$('ink-exit').onclick=exit;
 $('ink-undo').onclick=()=>{finish();if(current?.strokes.length){redo.push(current.strokes.pop());persist();draw();}};
 $('ink-redo').onclick=()=>{if(current&&redo.length){current.strokes.push(redo.pop());persist();draw();}};
 $('ink-clear').onclick=()=>{finish();if(current){current.strokes=[];redo=[];persist();draw();}};
 $('ink-delete').onclick=()=>{if(!current)return;const id=current.id;exit();records=records.filter(r=>r.id!==id);persist();};
 $('ink-clear-all').onclick=()=>{if(records.length&&!confirm('清空这道题的全部批注？此操作不可撤销。'))return;exit();records=[];persist();};
 $('ink-retain').onchange=persist;
 $('ink-records').onchange=()=>{const r=records.find(r=>r.id===$('ink-records').value);if(r)restore(r);};
 $('ink-export').onclick=()=>{finish();const blob=new Blob([JSON.stringify(pack())],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=root.LESSON.title+'-批注.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);dirty=false;say('已导出批注备份（包含暂停画面、时间、参数和笔迹）。');};
 $('ink-import').onchange=async()=>{const file=$('ink-import').files[0];if(!file)return;try{if(file.size>40*1024*1024)throw Error('文件超过 40 MB。');const incoming=validate(JSON.parse(await file.text()));const merged=new Map(records.map(r=>[r.id,r]));for(const r of incoming)merged.set(r.id,r);if(merged.size>60)throw Error('合并后超过 60 帧。');exit();records=[...merged.values()];persist();}catch(e){say('导入失败：'+e.message);}$('ink-import').value='';};
 function point(e){const r=canvas.getBoundingClientRect();return [Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))];}
 canvas.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();if(pointer!==null||!mode||e.button!==0)return;pointer=e.pointerId;canvas.setPointerCapture(pointer);stroke={tool:mode,color:$('ink-color').value,width:(mode==='eraser'?24:Number($('ink-width').value))/canvas.getBoundingClientRect().width,points:[point(e)]};draw();});
 canvas.addEventListener('pointermove',e=>{e.preventDefault();e.stopPropagation();if(e.pointerId!==pointer||!stroke)return;for(const p of e.getCoalescedEvents?.().length?e.getCoalescedEvents():[e])stroke.points.push(point(p));draw();});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,e=>{e.stopPropagation();if(e.pointerId===pointer)finish();});
 surface.addEventListener('wheel',e=>e.preventDefault(),{passive:false});surface.addEventListener('contextmenu',e=>e.preventDefault());
 root.addEventListener('physics:time',()=>{if(current&&!restoring&&Math.abs(ui.time-current.time)>1e-10)exit();});
 root.addEventListener('physics:rebuild',()=>{if(!restoring)exit();});
 // Any navigation action exits the frozen overlay before the live model changes.
 for(const id of ['play','restart','reset','timeline'])$(id).addEventListener(id==='timeline'?'input':'click',exit,{capture:true});
 for(const b of document.querySelectorAll('[data-view],#view-reset'))b.addEventListener('click',exit,{capture:true});
 for(const id of ['vector-options','label-options'])$(id).addEventListener('change',exit,{capture:true});
 root.addEventListener('keydown',e=>{if(e.key==='Escape')exit();});
 root.addEventListener('beforeunload',e=>{if(dirty&&$('ink-retain').checked){e.preventDefault();e.returnValue='';}});
 new ResizeObserver(bounds).observe(host);list();
 root.physicsInk={get frames(){return records.length;},get active(){return !!current;},get strokes(){return current?.strokes.length||0;},get tool(){return mode;}};
})(globalThis);
