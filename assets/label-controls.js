/* Reusable scene annotation choices; physical visibility stays on the child objects. */
(function(root){
 'use strict';
 root.PHYSICS_LABEL_CONTROLS={mount(host,kit){return {refresh(){
  host.replaceChildren();const legend=document.createElement('legend');legend.textContent='选择显示的标注';host.append(legend);
  if(!kit){host.append(document.createTextNode('三维显示不可用'));return;}
  for(const item of kit.listLabels()){
   const label=document.createElement('label'),input=document.createElement('input');
   input.type='checkbox';input.checked=item.enabled;input.dataset.label=item.id;input.setAttribute('aria-label',item.label);
   input.addEventListener('change',()=>{kit.setLabel(item.id,input.checked);kit.render();});
   label.append(input,document.createTextNode(item.label));host.append(label);
  }
 }};}};
})(globalThis);
