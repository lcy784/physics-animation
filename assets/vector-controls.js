/* Reusable controls: visibility preferences are independent of physical zero values. */
(function(root){
 'use strict';
 root.PHYSICS_VECTOR_CONTROLS={mount(host,kit){
  return {refresh(){
   host.replaceChildren();const legend=document.createElement('legend');legend.textContent='选择显示的矢量';host.append(legend);
   if(!kit){host.append(document.createTextNode('三维显示不可用'));return;}
   for(const item of kit.listVectors()){
    const label=document.createElement('label'),input=document.createElement('input'),swatch=document.createElement('i');
    input.type='checkbox';input.checked=item.enabled;input.dataset.vector=item.id;input.setAttribute('aria-label',item.label);
    swatch.style.background=item.color;swatch.setAttribute('aria-hidden','true');
    input.addEventListener('change',()=>{kit.setVector(item.id,input.checked);kit.render();});
    label.append(input,swatch,document.createTextNode(item.label));host.append(label);
   }
  }};
 }};
})(globalThis);
