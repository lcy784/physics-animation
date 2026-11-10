(function(root){
  'use strict';
  const {THREE:T,TrackballControls}=root.PHYSICS_VENDOR;
  function makeKit(host){
    const renderer=new T.WebGLRenderer({antialias:true,alpha:true});
    renderer.setPixelRatio(Math.min(devicePixelRatio,2)); renderer.setClearColor(0,0);
    host.appendChild(renderer.domElement);
    const scene=new T.Scene(),camera=new T.PerspectiveCamera(37,1,.01,2000);
    const controls=new TrackballControls(camera,renderer.domElement);
    controls.rotateSpeed=3;controls.zoomSpeed=1.15;controls.panSpeed=.7;controls.staticMoving=true;
    scene.add(new T.HemisphereLight(0xffffff,0x768b7c,2.5));
    const sun=new T.DirectionalLight(0xffffff,2);sun.position.set(-3,6,8);scene.add(sun);
    let group=new T.Group();scene.add(group);let target=new T.Vector3(),span=[8,4];
    const vectorGroup=new T.Group();group.add(vectorGroup);
    const vectorEntries=new Map(),vectorPreferences=new Map();
    const labelEntries=new Map(),labelPreferences=new Map();
    const v=p=>new T.Vector3(...p);
    function dispose(){
      group.traverse(o=>{o.geometry?.dispose();if(o.material){for(const m of(Array.isArray(o.material)?o.material:[o.material])){m.map?.dispose();m.dispose();}}});
      scene.remove(group);group=new T.Group();scene.add(group);group.add(vectorGroup);vectorGroup.clear();vectorEntries.clear();labelEntries.clear();
    }
    function add(o,parent=group){parent.add(o);return o;}
    function line(points,color=0x688077,parent=group){return add(new T.Line(new T.BufferGeometry().setFromPoints(points.map(v)),new T.LineBasicMaterial({color})),parent);}
    function setLine(obj,points){obj.geometry.dispose();obj.geometry=new T.BufferGeometry().setFromPoints(points.map(v));}
    function box(w,h,d,color=0x8bb4a5,opacity=1){return add(new T.Mesh(new T.BoxGeometry(w,h,d),new T.MeshStandardMaterial({color,roughness:.65,transparent:opacity<1,opacity,depthWrite:opacity>=1})));}
    function sphere(radius,color){return add(new T.Mesh(new T.SphereGeometry(radius,28,18),new T.MeshStandardMaterial({color,roughness:.34,metalness:.08})));}
    function label(text,pos,color='#304b4a',scale=.38,id=text,choice=text){
      if(labelEntries.has(id))throw Error('Duplicate label id: '+id);
      const c=document.createElement('canvas');const ctx=c.getContext('2d');
      const font='600 48px "Segoe UI", "Microsoft YaHei", sans-serif';ctx.font=font;c.width=Math.ceil(ctx.measureText(text).width+30);c.height=100;
      ctx.font=font;ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillStyle='rgba(255,254,250,.85)';ctx.fillRect(0,0,c.width,100);ctx.fillStyle=color;ctx.fillText(text,c.width/2,50);
      const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;
      const sprite=new T.Sprite(new T.SpriteMaterial({map:texture,transparent:true,depthTest:false}));sprite.scale.set(scale*c.width/100,scale,1);sprite.position.copy(v(pos));
      const wrapper=new T.Group();wrapper.visible=labelPreferences.get(id)!==false;add(wrapper);wrapper.add(sprite);sprite.userData.labelWrapper=wrapper;
      labelEntries.set(id,{group:wrapper,sprite,label:choice,color});return sprite;
    }
    function effectiveVisible(object){for(let o=object;o;o=o.parent)if(!o.visible)return false;return true;}
    function listLabels(){return [...labelEntries].map(([id,e])=>({id,label:e.label,color:e.color,enabled:e.group.visible,visible:effectiveVisible(e.sprite),members:e.group.children.length}));}
    function setLabel(id,on){if(!labelEntries.has(id))throw Error('Unknown label: '+id);labelPreferences.set(id,!!on);labelEntries.get(id).group.visible=!!on;}
    function registerLabelObject(object,id){if(!labelEntries.has(id))throw Error('Unknown label: '+id);labelEntries.get(id).group.add(object);return object;}
    function registerVector(object,id,label,color=0x216b61){
      if(!id||!label)throw Error('Vector needs a stable id and a readable label');
      if(!vectorEntries.has(id)){const g=new T.Group();g.visible=vectorPreferences.get(id)!==false;vectorGroup.add(g);vectorEntries.set(id,{group:g,label,color:'#'+new T.Color(color).getHexString()});}
      vectorEntries.get(id).group.add(object.userData.labelWrapper||object);return object;
    }
    function arrow(color,id,label){const a=new T.ArrowHelper(new T.Vector3(1,0,0),new T.Vector3(),1,color,.13,.07);return registerVector(a,id,label,color);}
    function listVectors(){return [...vectorEntries].map(([id,e])=>({id,label:e.label,color:e.color,enabled:e.group.visible,visibleMembers:e.group.visible?e.group.children.filter(o=>effectiveVisible(o)&&(!o.isGroup||o.children.some(c=>effectiveVisible(c)))).length:0,members:e.group.children.length}));}
    function setVector(id,on){if(!vectorEntries.has(id))throw Error('Unknown vector: '+id);vectorPreferences.set(id,!!on);vectorEntries.get(id).group.visible=!!on;}
    function setArrow(a,origin,delta){const d=v(delta),len=d.length();a.visible=len>1e-7;if(!a.visible)return;a.position.copy(v(origin));a.setDirection(d.normalize());a.setLength(len,Math.min(.15,len*.3),Math.min(.085,len*.16));}
    function view(name='front'){
      const dirs={front:[0,0,1],oblique:[.35,.45,1],side:[1,0,.02],top:[0,1,.02]};
      const dir=v(dirs[name]||dirs.front).normalize();camera.up.set(0,1,0);if(name==='top')camera.up.set(0,0,-1);
      const distance=Math.max(span[1],span[0]/camera.aspect)/(2*Math.tan(T.MathUtils.degToRad(camera.fov/2)))*1.18;
      camera.position.copy(target).addScaledVector(dir,distance);controls.target.copy(target);camera.lookAt(target);controls.update();
    }
    function frame(center,size){target=v(center);span=Array.isArray(size)?size:[size,size];view('front');}
    const resize=()=>{const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;
      const oldFit=Math.max(span[1],span[0]/camera.aspect);renderer.setSize(w,h);camera.aspect=w/h;
      const newFit=Math.max(span[1],span[0]/camera.aspect);
      camera.position.sub(controls.target).multiplyScalar(newFit/oldFit).add(controls.target);
      camera.updateProjectionMatrix();controls.handleResize();};
    const observer=new ResizeObserver(resize);observer.observe(host);resize();
    return {T,scene,camera,controls,renderer,add,line,setLine,box,sphere,label,arrow,setArrow,registerVector,listVectors,setVector,listLabels,setLabel,registerLabelObject,clear:dispose,frame,view,
      render:()=>{controls.update();renderer.render(scene,camera);},
      destroy:()=>{observer.disconnect();controls.dispose();dispose();renderer.dispose();}};
  }
  root.PHYSICS_SCENE_KIT={makeKit};
})(globalThis);
