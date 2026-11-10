(function(root){
 'use strict';
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const num=v=>Math.abs(v)<1e-10?'0':Number(v.toPrecision(4)).toString();
 const text=(x,y,s,size=13,color='#345852')=>`<text x="${x}" y="${y}" font-size="${size}" fill="${color}">${esc(s)}</text>`;
 const line=(x1,y1,x2,y2,color='#81968c',width=2,dash='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}" ${dash?'stroke-dasharray="'+dash+'"':''}/>`;
 const arrow=(x,y,dx,dy,color)=>{const len=Math.hypot(dx,dy);if(len<.2)return `<circle cx="${x}" cy="${y}" r="3" fill="${color}"/>`;const a=Math.atan2(dy,dx),h=Math.min(9,len*.35),px=x+dx,py=y+dy;return line(x,y,px,py,color,3)+`<path d="M${px-h*Math.cos(a-.5)},${py-h*Math.sin(a-.5)} L${px},${py} L${px-h*Math.cos(a+.5)},${py-h*Math.sin(a+.5)}" fill="none" stroke="${color}" stroke-width="3"/>`;};
 const rect=(x,y,w,h,color,opacity=1)=>`<rect x="${x}" y="${y}" width="${Math.max(0,w)}" height="${h}" fill="${color}" opacity="${opacity}" rx="3"/>`;
 const palette=['#268777','#b97b29','#8262b1','#427db0','#a65a63'];
 function balance(p){
  const rows=[...p.terms,{label:p.resultLabel||'合量',value:p.total,color:'#163f39'}],scale=Math.max(p.scale,...rows.map(r=>Math.abs(r.value)),1e-12);
  let out=line(320,10,320,rows.length*38+8,'#ccd9cf',1);
  rows.forEach((r,i)=>{const y=30+i*38,len=r.value/scale*175,col=r.color||palette[i%5];out+=text(8,y,r.label,14)+rect(Math.min(320,320+len),y-15,Math.abs(len),20,col)+text(510,y,num(r.value)+' '+p.unit,14);if(!len)out+=line(320,y-15,320,y+5,col,3);});
  return {h:rows.length*38+52,svg:out+text(225,rows.length*38+22,'← 负方向     0     正方向 →',12,'#71867d')+text(8,rows.length*38+44,'本图共用标尺：满幅 '+num(scale)+' '+p.unit,12,'#71867d')};
 }
 function flux(p){
  const width=540,left=30,range=Math.max(p.rangeMax-p.rangeMin,1e-9),X=x=>left+(x-p.rangeMin)/range*width;let out='';
  if(p.fieldEnd>p.fieldStart)out+=rect(X(p.fieldStart),40,X(p.fieldEnd)-X(p.fieldStart),80,'#b3d5c4',.45);
  for(const b of p.fieldSamples||[]){const xx=X(b.x),r=6*Math.max(0,b.normalized);out+=`<circle cx="${xx}" cy="78" r="${r}" fill="#458e78" opacity=".65"/>`;}
  for(const d of p.delta||[])out+=rect(X(d.from),42,X(d.to)-X(d.from),76,d.kind==='gain'?'#36aa92':'#d9a04e',.65);
  if(p.previousFront!==undefined){out+=`<rect x="${X(p.previousBack)}" y="40" width="${X(p.previousFront)-X(p.previousBack)}" height="80" stroke="#8c9d94" fill="none" stroke-dasharray="5 4"/>`;}
  out+=`<rect x="${X(p.back)}" y="40" width="${X(p.front)-X(p.back)}" height="80" stroke="#244e58" fill="none" stroke-width="3"/>`;
  out+=text(X(p.back)-10,31,p.backLabel||'后边',11)+text(X(p.front)-10,137,p.frontLabel||'前边',11);
  out+=text(18,164,p.caption,12);out+=text(18,187,p.deltaCaption||'虚线：上一采样时刻；绿：新增；金：减少。',11,'#71867d');
  return {h:202,svg:out};
 }
 function relative(p){
  if(!p.active)return{h:190,svg:text(28,75,'尚未接触弹簧',22)+text(28,110,'先看整体运动；接触后此处放大相对运动。',14)};
  const anchor=550,free=250,ball=free+(p.compression/p.freeLength)*(anchor-free),sc=170/Math.max(p.speedScale,1e-9);
  let out=text(10,25,'地面系速度 · 同起点同标尺；满幅 '+num(p.speedScale)+' m/s',12)+line(320,40,320,138,'#cad7cf',1)+arrow(320,54,p.vBall*sc,0,'#b97b29')+text(8,58,'球 '+num(p.vBall),14)+arrow(320,91,p.vBoard*sc,0,'#427db0')+text(8,95,'板 '+num(p.vBoard),14)+arrow(320,128,(p.vBall-p.vBoard)*sc,0,'#8262b1')+text(8,132,'差 '+num(p.vBall-p.vBoard),14);
  let pts='';for(let i=0;i<=100;i++){const u=i/100;pts+=(ball+(anchor-ball)*u)+','+(174+9*Math.sin(u*18*Math.PI))+' ';}
  out+=line(free,151,free,195,'#aebcb3',1,'4 3')+`<polyline points="${pts}" fill="none" stroke="#8262b1" stroke-width="2"/>`+line(anchor,145,anchor,198,'#427db0',8)+`<circle cx="${ball}" cy="174" r="9" fill="#b97b29"/>`+text(8,184,'相对位移视图',12)+text(125,221,p.contact===false?'已分离：c=0；弹簧不再施力。':'压缩 c = '+num(p.compression)+' m；ċ = '+num(p.compressionRate??(p.vBall-p.vBoard))+' m/s',12);
  return{h:238,svg:out};
 }
 function energy(p){let out='';p.rows.forEach((row,i)=>{const y=28+i*66;out+=text(8,y,row.label+(row.time!==undefined?' · t='+num(row.time)+' s':''),12);let x=10;row.terms.forEach((term,j)=>{const w=Math.max(0,term.value)/p.total*570;out+=rect(x,y+9,w,22,term.color||palette[j%5]);if(w>50)out+=text(x+5,y+25,num(term.value),11,'#fff');x+=w;});});let y=p.rows.length*66+12;out+=text(8,y,p.legend,11);return{h:y+20,svg:out};}
 function vectors(p){let out=line(90,180,540,180,'#b3c0b8',1)+line(280,20,280,220,'#d1dbd4',1);for(const v of p.vectors)out+=arrow(280,180,v.dx,v.dy,v.color)+text(290+v.dx,175+v.dy,v.label,12,v.color);out+=text(10,250,p.caption,12);return{h:270,svg:out};}
 const renderers={balance,flux,relative,energy,vectors};
 function mount(chainHost,panelsHost,onFocus){
  let focus=null,latest=null,signature='';
  function render(data){
   latest=data;const sig=data.nodes.map(n=>n.id).join('|');
   if(sig!==signature){chainHost.replaceChildren();for(const n of data.nodes){const b=document.createElement('button');b.className='law-node';b.dataset.law=n.id;b.innerHTML='<span></span><strong></strong><small></small>';b.addEventListener('click',()=>{focus=focus===n.id?null:n.id;onFocus(focus);render(latest);});chainHost.append(b);}signature=sig;}
   data.nodes.forEach((n,i)=>{const b=chainHost.children[i];b.classList.toggle('selected',n.id===focus);b.setAttribute('aria-pressed',String(n.id===focus));b.children[0].textContent=n.label;b.children[1].textContent=num(n.value)+' '+n.unit;b.children[2].textContent=n.law;});
   panelsHost.replaceChildren();for(const p of data.panels){const renderer=renderers[p.type];if(!renderer)throw Error('Unsupported mechanism panel '+p.type);const rendered=renderer(p);const card=document.createElement('section');card.className='mechanism-panel'+(p.node===focus||data.links?.[focus]?.includes(p.id)?' highlighted':'');card.dataset.panel=p.id;card.innerHTML='<h3>'+esc(p.title)+'</h3><div class="mechanism-canvas"><svg role="img" aria-label="'+esc(p.title)+'" viewBox="0 0 600 '+rendered.h+'" xmlns="http://www.w3.org/2000/svg" style="font-family:Segoe UI,Microsoft YaHei,sans-serif">'+rendered.svg+'</svg></div><p>'+esc(p.note||'')+'</p>';panelsHost.append(card);}
  }
  return {render,get data(){return latest;},get focus(){return focus;}};
 }
 root.PHYSICS_MECHANISM={mount};
})(globalThis);
