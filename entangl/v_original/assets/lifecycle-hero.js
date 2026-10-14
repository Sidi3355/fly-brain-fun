/* A single facility and six persistent buttons move with native page scrolling. */
(function(scope){
  'use strict';
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const mix=(a,b,p)=>a+(b-a)*p;
  const smooth=p=>{p=clamp(p);return p*p*(3-2*p);};
  function journeyLayout(width,height,progress){
    const mobile=width<825,compact=width<980,p=clamp(progress);
    const railX=22;
    const panelWidth=mobile?width-64:Math.min(432,width*.37);
    const panelX=mobile?64:86;
    const panelTop=mobile?height*mix(.36,.415,clamp((height-430)/150)):Math.max(40,height*.075);
    const heroTop=mobile?Math.max(175,height*.245):height*.205;
    const startWorld={x:width*.02,y:heroTop,w:width*.96,h:mobile?Math.max(150,height-150-heroTop):Math.min(height*.61,height-169-heroTop)};
    const endWorld=mobile?{x:51,y:4,w:width-50,h:panelTop-12}:{x:panelX+panelWidth+24,y:height*.065,w:width-panelX-panelWidth-24,h:height*.85};
    const world=Object.fromEntries(['x','y','w','h'].map(key=>[key,mix(startWorld[key],endWorld[key],p)]));
    const rowY=height-(mobile?100:104),rowInset=width/12;
    const railTop=panelTop+12,railBottom=mobile?height*.91:railTop+Math.max(220,Math.min(320,height*.49));
    // Establish vertical spacing before drawing the controls together, so touch targets never collide.
    const foldX=smooth(clamp((p-.48)/.52)),foldY=smooth(clamp(p/.48));
    const nodes=Array.from({length:6},(_,i)=>({x:mix(rowInset+i*(width-2*rowInset)/5,railX,foldX),y:mix(rowY,railTop+(railBottom-railTop)*i/5,foldY)}));
    const stageWidth=mobile?44:width/6-8,fold=clamp(p*1.45);
    const button={w:mix(stageWidth,44,fold),h:mix(mobile?44:98,44,fold)};
    const markers=nodes.map(n=>({x:n.x-button.w/2+(mobile?9:14-5*p)+13,y:n.y-button.h/2+(mobile?9:12-3*p)+13}));
    return {mobile,compact,world,nodes,markers,panel:{x:panelX,y:panelTop,w:panelWidth,h:height-panelTop-52},stageWidth,button};
  }
  function stageAt(travel,morph,step){return clamp(Math.floor((travel-morph)/step),0,5);}
  function createJourney(root,{setMoment,getMoment}){
    const $=s=>root.querySelector(s),$$=s=>[...root.querySelectorAll(s)];
    const inner=$('.life-hero-inner'),heading=$('.life-hero-heading'),world=$('.life-world-anchor');
    const nav=$('.life-stage-nav'),buttons=$$('[data-life-moment]'),panel=$('.life-hero-panel'),track=$('.life-stage-track');
    const base=$('.life-stage-track-base'),active=$('.life-stage-track-active'),progressFill=$('.life-journey-progress i');
    const reducedQuery=scope.matchMedia('(prefers-reduced-motion: reduce)');
    const reduced=()=>reducedQuery.matches||document.documentElement.classList.contains('reduce-motion');
    let width=1,height=1,start=0,morph=1,step=1,travel=0,progress=0,frame=0,jump=null,seenStage=-1,phase='intro',lastSnapshot=null;
    function rect(el,r){el.style.left=r.x.toFixed(2)+'px';el.style.top=r.y.toFixed(2)+'px';el.style.width=r.w.toFixed(2)+'px';el.style.height=r.h.toFixed(2)+'px';}
    function paint(){
      frame=0;travel=Math.max(0,scope.scrollY-start);
      const raw=clamp(travel/morph);progress=reduced()?(raw<.5?0:1):smooth(raw);
      phase=raw===0?'intro':raw<1?'transition':'reading';
      if(jump&&(Math.abs(scope.scrollY-jump.y)<3||performance.now()>jump.until))jump=null;
      if(!jump){
        const shouldRead=travel>=morph;
        if(shouldRead){const index=stageAt(travel,morph,step);if(index!==getMoment())setMoment(index);}
        else if(travel>morph*.26&&getMoment()!==0)setMoment(0);
      }
      const geometry=journeyLayout(width,height,progress),copyOpacity=smooth((progress-.46)/.45);
      root.style.setProperty('--life-morph',progress.toFixed(4));
      root.style.setProperty('--life-copy-opacity',copyOpacity.toFixed(4));
      root.style.setProperty('--life-label-opacity',(1-smooth(progress/.32)).toFixed(4));
      root.style.setProperty('--life-tool-opacity',smooth((progress-.6)/.4).toFixed(4));
      root.style.setProperty('--life-stage-width',geometry.stageWidth.toFixed(1)+'px');
      root.style.setProperty('--life-button-width',geometry.button.w.toFixed(2)+'px');
      root.style.setProperty('--life-button-height',geometry.button.h.toFixed(2)+'px');
      root.dataset.lifeReading=String(progress>.53);root.dataset.lifeMobile=String(geometry.mobile);
      root.dataset.lifePhase=phase;
      const headingOpacity=1-smooth(raw/.48);
      heading.style.opacity=headingOpacity.toFixed(4);heading.style.transform=`translateY(${-raw*100}px)`;
      heading.style.visibility=headingOpacity<.01?'hidden':'visible';
      world.style.left='0px';world.style.top='0px';
      world.style.transform=`translate3d(${geometry.world.x.toFixed(2)}px,${geometry.world.y.toFixed(2)}px,0)`;
      const modelWidth=geometry.world.w.toFixed(2)+'px',modelHeight=geometry.world.h.toFixed(2)+'px';
      if(world.style.width!==modelWidth)world.style.width=modelWidth;
      if(world.style.height!==modelHeight)world.style.height=modelHeight;
      rect(panel,geometry.panel);
      panel.style.transform=`translateY(${(1-copyOpacity)*24}px)`;panel.inert=progress<=.53;
      for(const selector of ['.life-pins','.life-world-bottom']){const tools=$(selector);if(tools)tools.inert=progress<=.6;}
      const path=geometry.markers.map((n,i)=>`${i?'L':'M'}${n.x.toFixed(2)},${n.y.toFixed(2)}`).join(' ');
      track.setAttribute('viewBox',`0 0 ${width} ${height}`);base.setAttribute('d',path);
      const selected=getMoment();
      const filled=geometry.markers.slice(0,selected+1).map((n,i)=>`${i?'L':'M'}${n.x.toFixed(2)},${n.y.toFixed(2)}`).join(' ');
      active.setAttribute('d',filled);nav.setAttribute('aria-orientation',progress>.5?'vertical':'horizontal');
      buttons.forEach((button,i)=>{const n=geometry.nodes[i];button.style.left=n.x.toFixed(2)+'px';button.style.top=n.y.toFixed(2)+'px';button.dataset.completed=String(i<selected);});
      if(seenStage!==selected){seenStage=selected;$('.life-hero-panel').scrollTop=0;}
      const fraction=clamp((travel-morph)/(step*6));progressFill.style.transform=`scaleX(${fraction})`;
      lastSnapshot={phase,progress,stage:selected,travel,morph,step,width,height,world:{...geometry.world},nodes:geometry.nodes.map(p=>({...p}))};
    }
    function requestPaint(){if(!frame)frame=requestAnimationFrame(paint);}
    function measure(){
      const header=document.querySelector('.site-header');const headerHeight=header?.getBoundingClientRect().height||80;
      height=Math.max(430,scope.innerHeight-headerHeight);width=inner.getBoundingClientRect().width;
      morph=Math.max(370,height*.78);step=Math.max(470,height*.86);
      root.style.setProperty('--life-header',headerHeight+'px');root.style.setProperty('--life-view-height',height+'px');
      root.style.setProperty('--life-total-height',(height+morph+step*6)+'px');
      start=root.getBoundingClientRect().top+scope.scrollY-headerHeight;
      root.classList.add('life-hero-enhanced');requestPaint();
    }
    function select(index,focusTab=false){
      index=clamp(Number(index),0,5);setMoment(index,focusTab);
      if(progress>.35){
        const y=start+morph+step*(index+.14);jump={y,until:performance.now()+1800};
        scope.scrollTo({top:y,behavior:reduced()?'instant':'smooth'});
      }
      requestPaint();
    }
    function cancelJump(){jump=null;}
    scope.addEventListener('scroll',requestPaint,{passive:true});scope.addEventListener('resize',measure,{passive:true});
    scope.addEventListener('wheel',cancelJump,{passive:true});scope.addEventListener('touchstart',cancelJump,{passive:true});
    scope.addEventListener('keydown',e=>{if(['PageDown','PageUp','End','Home',' '].includes(e.key)&&e.target===document.body)cancelJump();});
    reducedQuery.addEventListener?.('change',requestPaint);
    new MutationObserver(requestPaint).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
    if(document.fonts?.ready)document.fonts.ready.then(measure);
    measure();
    return Object.freeze({select,snapshot:()=>lastSnapshot});
  }
  scope.createEntanglLifecycleJourney=createJourney;
  if(typeof module!=='undefined'&&module.exports)module.exports={journeyLayout,stageAt};
})(typeof window!=='undefined'?window:globalThis);
