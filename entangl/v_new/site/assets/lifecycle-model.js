/* Detailed architectural mesh reused from the existing Entangl facility. */
window.createEntanglLifecycleModel = function(root,onSelect) {
  "use strict";
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const add=(a,b)=>a.map((v,i)=>v+b[i]), sub=(a,b)=>a.map((v,i)=>v-b[i]);
  const mul=(a,s)=>a.map(v=>v*s), dot=(a,b)=>a.reduce((v,x,i)=>v+x*b[i],0);
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const norm=a=>mul(a,1/(Math.hypot(...a)||1));
  const average=ps=>mul(ps.reduce((a,b)=>add(a,b),[0,0,0]),1/ps.length);
  const color=(s)=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16));
  const rgb=(c,f=1)=>`rgb(${c.map(v=>Math.round(clamp(v*f,0,255))).join(',')})`;
  const faces=[],floorFaces=[],shadows=[],drawings=[],targets={},articulated={doors:[],fans:[]};
  const material=(hex,kind='paint',texture=0)=>({c:color(hex),kind,texture});
  const M={
    floor:material('#cdcbbf','concrete',.15), slab:material('#babaae','concrete',.20), wall:material('#d8d7cd','concrete',.06),cap:material('#e4e3da','paint'),
    rack:material('#3b3d3a','paint'),door:material('#222724','paint'),trim:material('#63665f','metal'),black:material('#171d19','matte'),servers:material('#4f5550','paint'),
    silver:material('#adafa5','metal'),steel:material('#747b71','metal'),white:material('#c7c9bf','paint'),panel:material('#dadbd1','paint'),vents:material('#767b70','metal'),
    glass:material('#344a40','metal'),led:material('#c2e87b','emissive'),ledDim:material('#587265','emissive'),ochre:material('#d3bb76'), pipe:material('#92988d','metal'),darkpipe:material('#515b50','paint'),
  };
  const SUN=norm([-.6,1.1,.65]);

  function face(ps,mat,asset=null,normal=null,extra={}){
    const n=normal||norm(cross(sub(ps[1],ps[0]),sub(ps[2],ps[0])));
    const f={p:ps,m:mat,n,c:average(ps),asset,...extra};faces.push(f);return f;
  }
  function quad(ps,mat,asset=null,center=null){
    if(center&&dot(cross(sub(ps[1],ps[0]),sub(ps[2],ps[0])),sub(average(ps),center))<0)ps=ps.slice().reverse();
    return face(ps,mat,asset);
  }
  function box(x,y,z,w,h,d,mat,asset=null,bevel=0){
    const c=[x,y+h/2,z],min=[x-w/2,y,z-d/2],max=[x+w/2,y+h,z+d/2],b=Math.min(bevel,w/3,h/3,d/3);
    for(let axis=0;axis<3;axis++)for(const side of [-1,1]){
      const i=(axis+1)%3,j=(axis+2)%3,ps=[];
      for(const pair of [[-1,-1],[1,-1],[1,1],[-1,1]]){
        const p=c.slice();p[axis]=side<0?min[axis]:max[axis];p[i]=pair[0]<0?min[i]+b:max[i]-b;p[j]=pair[1]<0?min[j]+b:max[j]-b;ps.push(p);
      }quad(ps,mat,asset,c);
    }
    if(b){
      for(let axis=0;axis<3;axis++){
        const i=(axis+1)%3,j=(axis+2)%3;
        for(const si of [-1,1])for(const sj of [-1,1]){
          const ps=[];
          for(const [end,outer] of [[-1,0],[1,0],[1,1],[-1,1]]){
            const p=c.slice();p[axis]=end<0?min[axis]+b:max[axis]-b;
            p[i]=si<0?min[i]+(outer?b:0):max[i]-(outer?b:0);
            p[j]=sj<0?min[j]+(outer?0:b):max[j]-(outer?0:b);ps.push(p);
          }quad(ps,mat,asset,c);
        }
      }
      for(const a of [-1,1])for(const bside of [-1,1])for(const dside of [-1,1]){
        const signs=[a,bside,dside],ps=[];
        for(let ax=0;ax<3;ax++){const p=signs.map((v,i)=>v<0?min[i]+b:max[i]-b);p[ax]=signs[ax]<0?min[ax]:max[ax];ps.push(p);}quad(ps,mat,asset,c);
      }
    }
  }
  function cylinder(a,b,r,mat,asset=null,segments=14,r2=r){
    const dir=norm(sub(b,a)),u=norm(cross(dir,Math.abs(dir[1])<.9?[0,1,0]:[1,0,0])),v=cross(dir,u);
    const ring=(p,radius,i)=>add(p,add(mul(u,Math.cos(i/segments*Math.PI*2)*radius),mul(v,Math.sin(i/segments*Math.PI*2)*radius)));
    for(let i=0;i<segments;i++)quad([ring(a,r,i),ring(b,r2,i),ring(b,r2,i+1),ring(a,r,i+1)],mat,asset,mul(add(a,b),.5));
    face(Array.from({length:segments},(_,i)=>ring(b,r2,i)),mat,asset,dir);
    face(Array.from({length:segments},(_,i)=>ring(a,r,segments-i)),mat,asset,mul(dir,-1));
  }
  function pipe(points,r,mat,asset=null,segments=10){for(let i=1;i<points.length;i++)cylinder(points[i-1],points[i],r,mat,asset,segments);}
  function ellipseRing(x,y,z,r,t,mat,asset=null){
    const N=28;for(let i=0;i<N;i++){const a=i/N*Math.PI*2,b=(i+1)/N*Math.PI*2;
      quad([[x+Math.cos(a)*(r-t),y,z+Math.sin(a)*(r-t)],[x+Math.cos(a)*r,y,z+Math.sin(a)*r],[x+Math.cos(b)*r,y,z+Math.sin(b)*r],[x+Math.cos(b)*(r-t),y,z+Math.sin(b)*(r-t)]],mat,asset,[x,y-.1,z]);
    }
  }
  const stripe=(a,b,w,c,asset=null)=>drawings.push({a,b,w,c,asset});
  function planePanel(x,y,z,w,h,mat,asset,pattern=null){
    const f=quad([[x-w/2,y,z],[x+w/2,y,z],[x+w/2,y+h,z],[x-w/2,y+h,z]],mat,asset,[x,y+h/2,z-.1]);
    f.bias=.10;if(pattern)f.pattern=pattern;
    return f;
  }
  function footprint(x,z,w,d,h){shadows.push({x,z,w,d,h});}
  function register(id,label,kind,point,description,action,button){targets[id]={label,kind,point,description,action,button};}
  function ladderX(x1,x2,y,z,width=.35){
    for(const s of [-1,1])box((x1+x2)/2,y,z+s*width/2,x2-x1,.052,.04,M.steel);
    for(let x=x1;x<=x2;x+=.23)box(x,y-.028,z,.028,.025,width,M.silver);
  }
  function ladderZ(x,y,z1,z2,width=.37){
    for(const s of [-1,1])box(x+s*width/2,y,(z1+z2)/2,.04,.055,z2-z1,M.steel);
    for(let z=z1;z<=z2;z+=.24)box(x,y-.028,z,width,.025,.027,M.silver);
  }
  // Substantial concrete plinth, segmented walls, access details, and floor joints.
  box(0,-.52,0,16.0,.52,11.8,M.slab,null,.025);
  floorFaces.push(...faces.splice(0));
  box(0,0,-5.52,15.55,3.20,.22,M.wall,null,.018);
  box(-7.60,0,0,.23,3.20,11.25,M.wall,null,.012);
  box(7.62,0,-.15,.24,1.17,10.9,M.wall,null,.014);
  box(0,3.20,-5.52,15.8,.095,.32,M.cap);
  box(-7.60,3.20,0,.32,.095,11.35,M.cap);
  box(7.62,1.17,-.15,.32,.095,10.9,M.cap);
  for(const x of [-7.40,-3.6,.3,4.1,7.42])box(x,0,-5.32,.27,3.23,.32,M.wall,null,.025);
  for(const z of [-5.1,-1.9,1.5,5.35])box(-7.4,0,z,.33,3.25,.27,M.wall,null,.016);
  for(let x=-7.5;x<8;x+=1.0)stripe([x,.005,-5.4],[x,.005,5.82],.009,'#a9aaa0');
  for(let z=-5.5;z<6;z+=1.0)stripe([-7.48,.005,z],[7.48,.005,z],.009,'#a9aaa0');
  // In-wall access door and infrastructure distribution board.
  planePanel(-5.95,0,-5.382,1.03,2.25,M.trim,null,'louvers');
  box(-5.40,.82,-5.30,.035,.17,.04,M.steel);
  for(let i=0;i<3;i++)pipe([[-7.28,.95+i*.09,4.4],[-7.28,1.62+i*.09,4.4],[-7.28,1.62+i*.09,-4.55],[-6.6,1.62+i*.09,-4.55]],.018,M.pipe);
  for(const z of [-4,-2,0,2,4])box(-7.25,1.55,z,.08,.39,.05,M.steel);
  box(-7.24,.60,3.92,.4,1.03,.62,M.white,null,.024);
  // Equipment banks. Door grille is projected onto the actual front plane.
  function rack(x,z,id){
    box(x,.055,z,.9,.075,1.28,M.black,id,.016);
    box(x,.13,z,.88,2.20,1.20,M.rack,id,.035);
    box(x,.17,z+.614,.826,2.06,.04,M.trim,id,.018);
    const door=planePanel(x,.215,z+.64,.715,1.95,M.door,id,'rack');
    box(x+.306,.84,z+.667,.026,.26,.026,M.black,id,.01);
    box(x,.155,z-.63,.77,2.03,.025,M.rack,id);
    box(x,2.32,z,.81,.043,1.14,M.trim,id,.014);
    // Cable inlet and rear service connector.
    box(x,2.366,z-.33,.29,.018,.16,M.black,id,.014);
    const vent=face([[x-.29,2.375,z-.21],[x+.29,2.375,z-.21],[x+.29,2.375,z+.47],[x-.29,2.375,z+.47]],M.black,id,[0,1,0]);vent.pattern='topGrille';vent.bias=.015;
    footprint(x,z,.9,1.25,2.35);
  }
  for(const [bank,base] of [['A',-5.05],['B',.35]]){
    for(let row=0;row<3;row++)for(let col=0;col<4;col++)rack(base+col*.965,-3.83+row*1.46,bank==='B'?'hall-2':'hall-1');
    for(const x of [base-.24,base+3.13]){
      ladderZ(x,2.74,-4.6,.2,.29);
      for(const z of [-4.4,-2.7,-.9]){box(x,2.34,z,.029,.45,.029,M.silver);box(x,2.335,z,.13,.022,.13,M.trim);}
    }
    for(let row=0;row<3;row++){
      const z=-3.99+row*1.46;ladderX(base-.37,base+3.30,2.78,z,.35);
      for(let i=0;i<3;i++)pipe([[base-.38,2.83,z-.08+i*.058],[base+3.16,2.83,z-.08+i*.058]],.018,i===2?M.pipe:M.darkpipe);
      for(let col=0;col<4;col++)pipe([[base+col*.965,2.35,z+.1],[base+col*.965,2.57,z+.1],[base+col*.965+.08,2.76,z]],.025,M.darkpipe);
    }
  }
  ladderX(-5.45,3.8,2.88,.48,.43);
  for(let i=0;i<3;i++)pipe([[-5.35,2.91,.38+i*.072],[3.75,2.91,.38+i*.072]],.024,M.darkpipe);
  // White electrical switchgear in the foreground: doors, meters, hinges, louvres.
  for(let i=0;i<4;i++){
    const x=-6.02+i*.74,z=3.23;
    box(x,.05,z,.73,2.01,1.05,M.white,'switchgear',.029);
    box(x,.14,z+.541,.666,1.82,.03,M.panel,'switchgear',.012);
    box(x+.23,.86,z+.57,.031,.37,.033,M.black,'switchgear',.008);
    for(const y of [.35,1.73])box(x-.28,y,z+.572,.034,.10,.032,M.silver,'switchgear');
    planePanel(x,1.53,z+.56,.39,.27,M.vents,'switchgear','louvers');
    box(x-.02,1.18,z+.57,.18,.17,.02,M.trim,'switchgear',.008);
    planePanel(x-.02,1.205,z+.585,.139,.1,M.glass,'switchgear');
    footprint(x,z,.74,1.06,2.05);
  }
  for(const [x,id] of [[-2.75,'ups-b'],[-1.58,'ups-a']]){
    const z=3.29;
    box(x,.04,z,.83,.11,.99,M.trim,id,.018);
    const caseStart=faces.length;
    box(x,.15,z,.78,1.59,.91,M.white,id,.026);
    const casing=faces.splice(caseStart).filter(f=>!(f.n[2]>.99&&f.c[2]>z+.44));faces.push(...casing);
    box(x,.22,z+.32,.67,1.40,.14,M.black,id);
    for(let row=0;row<5;row++){
      box(x,.28+row*.24,z+.425,.58,.18,.045,M.steel,id);
      box(x+.19,.32+row*.24,z+.451,.07,.08,.014,M.ochre,id);
    }
    const doorStart=faces.length;
    box(x,.215,z+.47,.698,1.435,.026,M.panel,id,.008);
    box(x-.22,.52,z+.49,.023,.30,.028,M.steel,id);
    planePanel(x,1.34,z+.49,.4,.13,M.glass,id);
    planePanel(x,.25,z+.493,.48,.31,M.vents,id,'louvers');
    articulated.doors.push({id,pivot:[x-.35,0,z+.47],faces:faces.splice(doorStart)});
    footprint(x,z,.87,1.03,1.75);
  }
  // Incoming cable rises from the electrical section into an overhead tray.
  for(let i=0;i<3;i++)pipe([[-3.22,.15,2.69],[-3.22,2.56,2.69],[-3.18,2.90,2.53],[-3.18,2.90,.51]],.031,M.darkpipe);
  // Cooling plant: condenser bank, detailed axial fans, pipework and tanks.
  function fan(x,y,z,r){
    cylinder([x,y-.09,z],[x,y,z],r,M.trim,'crah-02',24);
    cylinder([x,y+.006,z],[x,y+.022,z],r*.89,M.black,'crah-02',24);
    const rotorStart=faces.length;
    for(let b=0;b<5;b++){
      const a=b/5*Math.PI*2,ps=[];
      for(const [da,rr] of [[-.30,.16],[.07,r*.84],[.65,r*.79],[.29,.18]])ps.push([x+Math.cos(a+da)*rr,y+.035,z+Math.sin(a+da)*rr]);
      face(ps,M.steel,'crah-02',[0,1,0]);
    }
    articulated.fans.push({point:[x,y,z],faces:faces.splice(rotorStart)});
    cylinder([x,y+.025,z],[x,y+.07,z],r*.14,M.silver,'crah-02',14);
    for(const rr of [.37,.57,.77,.95])ellipseRing(x,y+.09,z,r*rr,.009,M.silver,'crah-02');
    for(let t=0;t<8;t++){
      const a=t/8*Math.PI*2;cylinder([x+Math.cos(a)*r*.16,y+.09,z+Math.sin(a)*r*.16],[x+Math.cos(a)*r*.98,y+.09,z+Math.sin(a)*r*.98],.009,M.steel,'crah-02',5);
    }
  }
  box(5.65,.025,2.29,2.70,.19,3.98,M.slab,null,.035);
  box(5.49,.24,2.35,1.79,1.44,3.39,M.silver,'crah-02',.045);
  for(const x of [4.77,6.21])for(const z of [.9,2.36,3.83])box(x,.08,z,.12,.33,.13,M.steel,'crah-02');
  for(let k=0;k<3;k++){
    const z=1.14+k*1.20;fan(5.49,1.80,z,.493);
    box(5.49,1.70,z,1.82,.055,1.18,M.white,'crah-02',.018);
    // Cross braces along the side of the unit, front finned coil.
    box(4.572,.33,z,.036,1.29,.04,M.white,'crah-02');
  }
  const coolingDoorStart=faces.length;
  planePanel(5.49,.32,4.084,1.57,1.23,M.vents,'crah-02','coil');
  articulated.doors.push({id:'crah-02',pivot:[4.70,0,4.084],faces:faces.splice(coolingDoorStart)});
  planePanel(5.49,.34,4.075,1.49,1.15,M.black,'crah-02');
  for(let r=0;r<5;r++)box(5.49,.4+r*.19,4.081,1.30,.08,.013,M.pipe,'crah-02');
  const sideCoil=face([[4.58,.31,.71],[4.58,.31,4.02],[4.58,1.62,4.02],[4.58,1.62,.71]],M.vents,'crah-02',[-1,0,0]);sideCoil.pattern='coil';sideCoil.bias=.12;
  for(const z of [.75,1.92,3.12,4.02])box(4.547,.29,z,.055,1.38,.047,M.white,'crah-02');
  box(5.49,.23,4.076,1.80,.085,.055,M.white,'crah-02');
  box(5.49,1.60,4.076,1.80,.095,.055,M.white,'crah-02');
  footprint(5.65,2.3,2.65,3.94,1.95);
  // Secondary rear heat-exchange unit.
  box(5.57,.03,-3.45,2.29,.18,2.17,M.slab);
  box(5.5,.29,-3.45,1.99,1.86,1.81,M.silver,'crah-02',.035);
  planePanel(5.50,.46,-2.526,1.72,1.51,M.vents,'crah-02','coil');
  for(const x of [4.96,5.50,6.04])fan(x,2.21,-3.45,.255);
  footprint(5.5,-3.45,2.1,2,2.4);
  // Vessels, insulated water lines and flanges.
  for(const [x,z,h] of [[6.20,-1.05,1.65],[5.42,-1.15,1.35]]){
    cylinder([x,.14,z],[x,h,z],.235,M.silver,'crah-02',20);
    cylinder([x,h,z],[x,h+.16,z],.235,M.silver,'crah-02',20,.11);
    cylinder([x,h+.16,z],[x,h+.29,z],.075,M.steel,'crah-02');
    box(x,.03,z,.46,.11,.42,M.steel,'crah-02');
    pipe([[x,h+.25,z],[x,h+.47,z],[x+.18,h+.54,z],[6.83,h+.54,z],[6.83,h+.54,-3.4]],.071,M.pipe,'crah-02',14);
  }
  for(let i=0;i<2;i++){
    const x=6.73+i*.22;
    pipe([[x,.35,4.3],[x,.50,4.48],[x,1.19,4.48],[x,1.40,4.28],[x,1.40,.6],[x,1.65,.41],[x,1.65,-4.38],[x-.4,1.65,-4.38]],.073,M.pipe,'crah-02',14);
    for(const z of [-3.9,-1.65,.8,3.8]){
      cylinder([x,1.40,z-.025],[x,1.40,z+.025],.111,M.steel,'crah-02',16);
      box(x,.03,z,.15,1.35,.044,M.steel,'crah-02');
    }
  }
  // Back-wall conduit risers and clean service-zone demarcation.
  for(const x of [-.85,3.96])pipe([[x,.1,-5.25],[x,2.81,-5.25],[x+.20,2.99,-5.25],[x+.6,2.99,-5.25]],.022,M.pipe);
  register('ups-b','UPS-B','Power',[-2.75,1.80,3.3],'Power equipment, engineering references, and the work that depends on them. This model is illustrative.','drawing','Inspect engineering context');
  register('hall-2','HALL 02','Capacity',[2.25,2.53,-.85],'The same space, viewed through operations, the customer, and the next capacity conversation.','growth','Explore customer capacity');
  register('crah-02','COOLING','Telemetry',[5.52,2.02,2.33],'Cooling equipment connected to an illustrative sensor, issue, and reviewed field workflow.','asset','Inspect equipment context');
  register('ups-a','UPS-A','Power',[-1.58,1.80,3.29],'A second illustrative power asset, connected to the reference electrical design. Availability and state are not verified.','drawing','Inspect engineering context');
  register('switchgear','SWITCHGEAR','Power',[-4.80,2.10,3.23],'Electrical distribution equipment shown for architectural context. This model is not a switching diagram or an authorization to work.','drawing','Inspect the sample design');
  register('hall-1','HALL 01','Operations',[-3.50,2.53,-.85],'An illustrative data hall with rack-level architectural detail. The model does not establish live capacity or equipment availability.','boundaries','About this facility model');

  // The proposed wing belongs to the same scene and is never remounted.
  const wingStart=faces.length;
  box(10.12,-.52,-1.0,4.3,.52,9.7,M.slab,'expansion',.025);
  box(11.12,-.52,3.2,6.3,.47,9.5,material('#747e70'),'expansion',.025);
  faces.slice(wingStart).forEach(f=>f.part='wing-slab');
  const wallStart=faces.length;
  box(10.12,0,-5.52,4.3,2.72,.22,M.wall,'expansion',.018);
  box(12.15,0,-1.0,.20,.72,9.3,M.wall,'expansion',.018);
  for(const x of [8.16,10.13,12.1]){box(x,0,-5.3,.18,3.0,.18,M.steel,'expansion');box(x,0,3.2,.18,3.0,.18,M.steel,'expansion');}
  box(10.13,2.88,-5.3,4.1,.16,.18,M.steel,'expansion');
  box(10.13,2.88,3.2,4.1,.16,.18,M.steel,'expansion');
  faces.slice(wallStart).forEach(f=>f.part='wing-shell');
  const rackStart=faces.length;
  for(let row=0;row<3;row++)for(let col=0;col<3;col++)rack(8.98+col*.96,-3.8+row*1.55,'expansion');
  box(10.0,.04,2.6,2.6,.9,1.12,M.silver,'expansion',.04);
  faces.slice(rackStart).forEach(f=>f.part='wing-fitout');
  register('expansion','HALL 03','Planned',[10.20,2.48,-.25],'A possible new hall, subject to design and operational acceptance.','','');

  // All actors and equipment are real meshes, built once and posed in the same world.
  const P={navy:material('#42647b'),orange:material('#f0934c'),vest:material('#d9ed82'),
    skin:material('#c99776'),skinDark:material('#835945'),boots:material('#26342f'),
    helmet:material('#f5ead2'),reflect:material('#f3f0cf'),red:material('#ef795b'),
    cyan:material('#75c9d1'),wood:material('#c6a477'),paper:material('#f0edda'),
    road:material('#737e70'),yellow:material('#e9bd61'),blue:material('#a1bdd1')};
  function capture(build){const start=faces.length;build();return faces.splice(start);}
  function stroke3(a,b,w,mat){cylinder(a,b,w,mat,null,5);}
  const prefabs={};
  function prefab(name,build){prefabs[name]=capture(build);}
  function wheels(w,d){for(const x of [-w/2,w/2])for(const z of [-d/2,d/2])cylinder([x-.045,.15,z],[x+.045,.15,z],.13,P.boots,null,10);}
  function frame(x,y,z,w,h,d,mat){
    for(const dx of [-w/2,w/2])for(const dz of [-d/2,d/2])box(x+dx,y,z+dz,.045,h,.045,mat);
    for(const dy of [0,h]){box(x,y+dy,z,w,.045,.045,mat);}
  }
  // A service apron gives vehicles and arriving teams a place outside the building.
  box(0,-.52,7.4,16,.47,3.05,P.road,null,.025);
  for(let x=-7;x<8;x+=2.0)box(x,-.04,7.4,.045,.014,2.45,M.panel);
  box(0,.012,4.85,14.2,.014,.035,P.yellow);
  box(-6.85,.014,2.8,.035,.014,4.15,P.yellow);
  for(const l of drawings)stroke3(l.a,l.b,.004,material(l.c));
  // Contact shadows are geometry too, so moving figures stay grounded.
  prefab('shadow',()=>cylinder([0,.016,0],[0,.019,0],.34,material('#9eaa91'),null,16));
  prefab('cone',()=>{
    box(0,0,0,.35,.045,.35,P.boots);cylinder([0,.045,0],[0,.56,0],.14,P.orange,null,10,.027);
    cylinder([0,.23,0],[0,.32,0],.09,P.reflect,null,10,.067);
  });
  prefab('barrier',()=>{
    for(const x of [-.64,.64]){box(x,.03,0,.39,.08,.32,P.boots);box(x,.11,0,.055,.98,.055,P.yellow);}
    box(0,.65,0,1.4,.24,.05,P.yellow);
    for(let x=-.58;x<.65;x+=.24)box(x,.65,.028,.085,.24,.013,P.boots);
  });
  prefab('toolcart',()=>{
    wheels(.64,.43);box(0,.26,0,.78,.64,.52,P.orange,null,.035);
    for(let i=0;i<3;i++){box(0,.34+i*.16,.27,.69,.012,.015,M.black);box(0,.40+i*.16,.285,.27,.025,.027,M.steel);}
    box(0,.91,0,.82,.045,.56,P.boots);box(-.25,.96,0,.18,.12,.29,M.silver);
    stroke3([.10,.97,-.15],[.22,.97,.12],.025,M.steel);box(.30,1.0,.04,.10,.1,.20,P.yellow);
    pipe([[-.43,.73,-.2],[-.43,1.0,-.2],[-.43,1.0,.2],[-.43,.73,.2]],.025,M.steel);
  });
  prefab('loadbank',()=>{
    wheels(.70,.65);box(0,.25,0,.88,.95,.78,P.yellow,null,.04);
    planePanel(0,.34,.407,.74,.50,M.vents,null,'louvers');box(0,.94,.41,.42,.17,.02,P.boots);
    for(const x of [-.13,.02,.15])box(x,1.0,.43,.045,.05,.016,P.cyan);
  });
  prefab('crate',()=>{
    box(0,.07,0,.7,.6,.63,P.wood,null,.025);
    for(const x of [-.22,.22])box(x,.05,0,.07,.64,.67,M.ochre);
    box(0,.2,.327,.34,.22,.012,P.paper);box(0,0,0,.79,.09,.7,P.wood);
  });
  prefab('filter',()=>{
    box(0,.02,0,.76,.84,.09,M.trim);planePanel(0,.09,.051,.64,.68,M.white,null,'coil');
  });
  prefab('ladder',()=>{
    for(const x of [-.3,.3]){stroke3([x,.02,.42],[x,1.95,0],.035,M.silver);stroke3([x,.02,-.42],[x,1.95,0],.035,M.silver);}
    for(let i=0;i<6;i++)stroke3([-.3,.23+i*.28,.37-i*.06],[.3,.23+i*.28,.37-i*.06],.028,M.silver);
    box(0,1.92,0,.69,.06,.23,P.yellow);
  });
  prefab('table',()=>{
    box(0,.94,0,1.65,.10,.75,P.wood,null,.025);
    for(const x of [-.65,.65])for(const z of [-.24,.24])box(x,0,z,.055,.94,.055,M.steel);
    box(-.32,1.045,.05,.52,.013,.31,P.paper);box(.43,1.045,-.06,.42,.02,.30,P.boots);
    planePanel(.43,1.066,.09,.32,.018,P.cyan);
  });
  prefab('board',()=>{
    for(const x of [-.55,.55]){box(x,.05,0,.05,1.95,.05,M.steel);box(x,.01,0,.22,.07,.68,M.trim);}
    box(0,1.04,0,1.52,1.02,.08,M.trim);box(0,1.09,.046,1.42,.92,.016,P.paper);
    for(let r=0;r<4;r++){box(-.51,1.76-r*.17,.060,.075,.075,.010,P.vest);box(.12,1.785-r*.17,.061,.90,.024,.011,M.steel);}
    box(0,1.92,.062,1.21,.04,.012,P.navy);
  });
  prefab('shelf',()=>{
    frame(0,0,0,1.68,1.65,.6,M.steel);
    for(const y of [.12,.63,1.14]){box(0,y,0,1.74,.055,.66,M.silver);for(const x of [-.54,0,.54]){box(x,y+.06,0,.43,.34,.47,P.wood);box(x,y+.13,.241,.22,.10,.01,P.paper);}}
    box(0,1.55,.32,1.7,.2,.026,P.navy);
  });
  prefab('trolley',()=>{
    wheels(.74,.7);box(0,.22,0,.94,.09,.9,M.steel);
    pipe([[-.40,.23,-.39],[-.40,1.28,-.39],[.4,1.28,-.39],[.4,.23,-.39]],.035,P.navy);
    box(0,.31,.03,.66,.64,.65,P.wood);box(0,.51,.37,.31,.18,.012,P.paper);
  });
  prefab('van',()=>{
    box(0,.35,0,1.55,1.36,2.80,M.panel,null,.1);
    box(0,.41,1.76,1.53,.62,.87,M.white,null,.09);
    box(0,1.03,1.35,1.44,.68,.97,M.panel,null,.06);
    planePanel(0,1.13,1.85,1.23,.49,P.navy);
    for(const x of [-.783,.783]){
      box(x,.96,0,.013,.35,2.10,P.navy);
      for(const z of [-.93,1.43]){cylinder([x-.08,.38,z],[x+.08,.38,z],.34,P.boots,null,16);cylinder([x-.095,.38,z],[x+.095,.38,z],.15,M.silver,null,12);}
    }
    for(const x of [-.52,.52])box(x,.71,2.202,.30,.18,.017,P.reflect);
    box(0,.44,2.21,1.47,.14,.12,M.trim);
  });
  prefab('beacon',()=>{
    box(0,.02,0,.38,.10,.36,P.boots);cylinder([0,.1,0],[0,1.4,0],.037,M.steel,null,8);
    cylinder([0,1.4,0],[0,1.58,0],.13,P.red,null,12);
    cylinder([0,1.59,0],[0,1.64,0],.13,P.reflect,null,12);
  });
  prefab('warning',()=>{
    face([[-.52,0,0],[.52,0,0],[0,.90,0]],P.orange,null,[0,0,1]);
    face([[.52,0,-.035],[-.52,0,-.035],[0,.90,-.035]],P.orange,null,[0,0,-1]);
    box(0,.31,.016,.085,.31,.025,P.boots);box(0,.15,.016,.085,.08,.025,P.boots);
  });
  prefab('clipboard',()=>{
    box(0,0,0,.38,.51,.04,P.navy);box(0,.04,.025,.31,.41,.015,P.paper);
    for(let i=0;i<4;i++)box(0,.12+i*.07,.036,.24,.015,.008,M.steel);box(0,.45,.042,.17,.055,.017,M.silver);
  });
  prefab('evidence',()=>{
    box(0,.02,0,.39,.045,.35,P.boots);box(0,.06,0,.035,.90,.035,M.steel);
    box(0,.84,0,.52,.66,.05,P.navy);box(0,.90,.028,.44,.52,.014,P.paper);
    for(let i=0;i<3;i++)box(.03,1.0+i*.12,.041,.26,.016,.011,M.steel);
    stroke3([-.15,1.29,.046],[-.09,1.23,.046],.014,P.navy);stroke3([-.09,1.23,.046],[.04,1.37,.046],.014,P.navy);
  });
  prefab('crane-base',()=>{
    box(0,.02,0,1.15,.28,1.3,P.yellow);
    for(const x of [-.4,.4])for(const z of [-.4,.4])box(x,.30,z,.09,4.75,.09,P.yellow);
    for(let i=0;i<8;i++){
      const y=.33+i*.57;
      for(const z of [-.4,.4])stroke3([-.4,y,z],[.4,y+.56,z],.028,P.yellow);
      for(const x of [-.4,.4])stroke3([x,y,-.4],[x,y+.56,.4],.028,P.yellow);
    }
    box(0,4.9,0,1.05,.28,1.03,P.yellow);
  });
  prefab('crane-boom',()=>{
    for(const z of [-.22,.22]){stroke3([-4.7,0,z],[1.25,0,z],.055,P.yellow);stroke3([-4.7,.48,z],[1.25,.48,z],.042,P.yellow);}
    for(let x=-4.7;x<1.2;x+=.49)for(const z of [-.22,.22])stroke3([x,0,z],[x+.49,.48,z],.028,P.yellow);
    box(.95,-.50,0,.7,.51,.85,M.slab);box(-.25,-.57,.55,.75,.64,.67,P.yellow);
    box(-.25,-.39,.897,.58,.39,.015,P.navy);
    stroke3([0,1.25,0],[-4.6,.49,0],.016,M.steel);stroke3([0,1.25,0],[1.23,.49,0],.016,M.steel);
  });
  prefab('newrack',()=>{const n=shadows.length;rack(0,0,'expansion');shadows.length=n;});
  prefab('unit-cable',()=>cylinder([0,0,0],[0,1,0],.018,M.steel,null,6));
  prefab('air-arrow',()=>{
    box(0,0,0,.065,.04,.80,P.cyan);
    face([[-.19,.03,.22],[.19,.03,.22],[0,.03,.57]],P.cyan,null,[0,1,0]);
  });
  prefab('heat-wave',()=>{
    const ps=[];for(let y=0;y<=1.5;y+=.13)ps.push([Math.sin(y*6)*.10,y,0]);pipe(ps,.021,P.orange,null,6);
  });
  // Human surfaces carry continuous vertex normals, while the architecture retains crisp edges.
  function smoothFace(points,normals,mat){
    if(dot(cross(sub(points[1],points[0]),sub(points[2],points[0])),average(normals))<0){points.reverse();normals.reverse();}
    face(points,mat,null,norm(average(normals)),{vn:normals});
  }
  function ellipsoid(center,radii,mat,segments=20,rings=10,end=Math.PI){
    const vertex=(row,col)=>{
      const phi=row/rings*end,theta=col/segments*Math.PI*2;
      const unit=[Math.sin(phi)*Math.cos(theta),Math.cos(phi),Math.sin(phi)*Math.sin(theta)];
      return {p:unit.map((v,i)=>center[i]+v*radii[i]),n:norm(unit.map((v,i)=>v/radii[i]))};
    };
    for(let row=0;row<rings;row++)for(let col=0;col<segments;col++){
      const corners=row===0?[[row,col],[row+1,col],[row+1,col+1]]:
        row===rings-1&&end===Math.PI?[[row,col],[row+1,col],[row,col+1]]:
        [[row,col],[row+1,col],[row+1,col+1],[row,col+1]];
      const vs=corners.map(([r,c])=>vertex(r,c));smoothFace(vs.map(v=>v.p),vs.map(v=>v.n),mat);
    }
  }
  // Elliptical clothing profiles: height, half-width, half-depth, forward offset.
  function loft(profiles,mat,segments=20,cap=true){
    const vertex=(row,col)=>{
      const [y,rx,rz,z=0]=profiles[row],a=profiles[Math.max(0,row-1)],b=profiles[Math.min(profiles.length-1,row+1)];
      const dy=b[0]-a[0]||1,dx=(b[1]-a[1])/dy,dz=(b[2]-a[2])/dy,shift=((b[3]||0)-(a[3]||0))/dy;
      const theta=col/segments*Math.PI*2,c=Math.cos(theta),s=Math.sin(theta);
      return {p:[rx*c,y,z+rz*s],n:norm([c/rx,-dx/rx*c*c-dz/rz*s*s-shift/rz*s,s/rz])};
    };
    for(let row=0;row<profiles.length-1;row++)for(let col=0;col<segments;col++){
      const vs=[[row,col],[row+1,col],[row+1,col+1],[row,col+1]].map(([r,c])=>vertex(r,c));
      smoothFace(vs.map(v=>v.p),vs.map(v=>v.n),mat);
    }
    if(cap)for(const row of [0,profiles.length-1]){
      const n=[0,row===0?-1:1,0];smoothFace(Array.from({length:segments},(_,i)=>vertex(row,i).p),Array.from({length:segments},()=>n),mat);
    }
  }
  const H={shirt:material('#4b5962'),trousers:material('#3e494f'),seam:material('#566167'),
    vest:material('#aebc78'),response:material('#c58d5c'),vendor:material('#748b8e'),office:material('#8a9aa2'),
    jacket:material('#6f777b'),skin:material('#b98f76'),skinDark:material('#81624e'),
    helmet:material('#d7d8ce'),reflect:material('#cbd1c3'),boots:material('#363c3e'),sole:material('#262d2f'),
    hair:material('#45413c'),eye:material('#655249'),glove:material('#a8a492'),screen:material('#38565b')};
  prefab('field-tablet',()=>{
    box(0,0,0,.28,.19,.018,H.boots,null,.011);box(0,.017,.010,.244,.155,.004,H.screen,null,.004);
    for(let i=0;i<3;i++){box(-.083,.051+i*.035,.013,.018,.013,.001,H.vest);box(.018,.054+i*.035,.013,.136,.005,.001,H.reflect);}
    box(0,.157,.013,.19,.008,.001,H.office);
  });
  prefab('service-tool',()=>{
    cylinder([0,-.025,0],[0,.11,0],.016,H.boots,null,12,.013);
    cylinder([0,.10,0],[0,.225,0],.005,M.steel,null,10);
  });
  const common={
    pelvis:capture(()=>loft([[-.075,.129,.095],[0,.156,.106],[.055,.149,.097],[.09,.145,.094]],H.trousers)),
    thigh:capture(()=>{
      ellipsoid([0,.025,0],[.082,.083,.084],H.trousers,16,8);
      loft([[0,.079,.082],[.09,.085,.085],[.21,.074,.078],[.33,.060,.066],[.40,.055,.058]],H.trousers,16);
    }),
    shin:capture(()=>{
      ellipsoid([0,0,0],[.057,.059,.060],H.trousers,16,8);
      loft([[0,.055,.057],[.12,.061,.064],[.26,.052,.055],[.36,.044,.046],[.40,.046,.048]],H.trousers,16);
      ellipsoid([0,.025,.048],[.041,.056,.018],H.seam,12,6);
    }),
    boot:capture(()=>{
      loft([[.014,.054,.119,.042],[.024,.064,.137,.045],[.048,.065,.136,.045],[.057,.062,.130,.045]],H.sole,20);
      loft([[.051,.061,.126,.044],[.073,.062,.124,.043],[.103,.056,.104,.030],[.133,.047,.070,.010],[.18,.045,.054,0]],H.boots,20);
      for(let i=0;i<3;i++)cylinder([-.024,.117+i*.016,.075-i*.012],[.024,.117+i*.016,.075-i*.012],.0035,H.seam,null,6);
    })
  };
  const people={};
  for(const [role,shirt,skin,vest,helmet] of [
    ['engineer',H.shirt,H.skin,H.vest,true],['responder',H.shirt,H.skinDark,H.response,true],
    ['outgoing',H.shirt,H.skin,null,false],['incoming',H.shirt,H.skinDark,H.vest,true],
    ['vendor',H.vendor,H.skin,H.vest,true],['auditor',H.office,H.skinDark,null,false],
    ['customer',H.jacket,H.skin,null,false]]){
    const torsoProfile=[[.04,.147,.095],[.13,.153,.108],[.29,.179,.125],[.41,.195,.116],[.46,.194,.090],[.50,.142,.078],[.53,.052,.050]];
    people[role]={...common,
      torso:capture(()=>{
        loft(torsoProfile,vest||shirt,24);
        // Work vest strips follow the cloth surface instead of floating on a rectangular body.
        if(vest){
          for(const side of [-1,1])for(const front of [-1,1]){
            const ps=torsoProfile.slice(0,-1).map(([y,rx,rz])=>{
              const x=side*(y>.44?.08:.105),half=.011;
              return [x-half,x+half].map(px=>[px,y,front*(rz*Math.sqrt(Math.max(0,1-px*px/(rx*rx)))+.002)]);
            });
            for(let i=0;i<ps.length-1;i++)quad([ps[i][0],ps[i][1],ps[i+1][1],ps[i+1][0]],H.reflect,null,[0,.28,0]);
          }
          loft([[.145,.156,.112],[.165,.158,.114]],H.reflect,24,false);
        }
        // Collar, placket and fabric pockets read as actual workwear at closer zoom.
        loft([[.514,.053,.052],[.549,.047,.044]],shirt,20);
        cylinder([0,.14,.112],[0,.41,.119],.0035,H.seam,null,6);
        for(const side of [-1,1]){
          quad([[side*.055,.34,.121],[side*.126,.34,.096],[side*.124,.275,.109],[side*.055,.275,.124]],shirt,null,[0,.30,0]);
          cylinder([side*.059,.339,.122],[side*.122,.339,.100],.0025,H.seam,null,6);
        }
        loft([[.536,.039,.038],[.598,.038,.036]],skin,16);
      }),
      head:capture(()=>{
        ellipsoid([0,.118,-.006],[.078,.114,.086],skin,24,12);
        loft([[.008,.032,.042,.025],[.026,.052,.062,.025],[.071,.071,.074,.015],[.112,.075,.077,0]],skin,20);
        for(const side of [-1,1]){
          ellipsoid([side*.077,.111,-.002],[.015,.025,.013],skin,12,6);
          ellipsoid([side*.029,.121,.073],[.016,.004,.004],H.eye,12,4);
          ellipsoid([side*.030,.136,.071],[.021,.003,.006],H.hair,12,4);
        }
        ellipsoid([0,.105,.083],[.011,.027,.023],skin,12,8);
        ellipsoid([0,.087,.104],[.014,.010,.014],skin,12,6);
        ellipsoid([0,.055,.085],[.021,.0028,.003],H.eye,12,4);
        ellipsoid([0,.163,-.014],[.079,.072,.081],H.hair,20,7,Math.PI*.53);
        if(helmet){
          ellipsoid([0,.185,-.004],[.098,.070,.104],H.helmet,24,9,Math.PI/2);
          loft([[.179,.102,.113,.004],[.185,.108,.125,.012],[.192,.103,.116,.006]],H.helmet,24);
          for(const side of [-1,1])pipe([[side*.029,.244,-.044],[side*.033,.254,0],[side*.029,.244,.049]],.003,H.reflect,null,8);
        }
      }),
      upperArm:capture(()=>{
        ellipsoid([0,.017,0],[.064,.072,.065],shirt,16,8);
        loft([[0,.060,.062],[.080,.064,.063],[.19,.054,.053],[.29,.044,.045]],shirt,16);
      }),
      forearm:capture(()=>{
        ellipsoid([0,0,0],[.044,.048,.045],shirt,16,8);
        loft([[0,.043,.044],[.07,.047,.047],[.17,.040,.039],[.247,.032,.032],[.265,.031,.031]],shirt,16);
        loft([[.241,.033,.033],[.263,.033,.033]],H.seam,16,false);
      }),
      hand:capture(()=>{
        const mat=helmet?H.glove:skin;
        ellipsoid([0,.035,0],[.033,.047,.020],mat,16,8);
        for(let i=0;i<4;i++)ellipsoid([-.022+i*.014,.083-Math.abs(i-1.5)*.003,.005],[.0078,.034-Math.abs(i-1.5)*.003,.009],mat,10,6);
        ellipsoid([-.031,.028,.015],[.012,.027,.012],mat,12,6);
      })
    };
  }

  const $=s=>root.querySelector(s),$$=s=>[...root.querySelectorAll(s)];
  let canvas=$('.life-canvas');const fxCanvas=$('.life-effects'),fx=fxCanvas.getContext('2d');
  if(!fx)throw new Error('Canvas unavailable');
  const state={yaw:.59,elev:.65,zoom:1,width:1,height:1,dpr:1,visible:false,drag:false,paused:false,rendered:0,time:0};
  const initialCamera={yaw:state.yaw,elev:state.elev,zoom:state.zoom},view={...initialCamera};
  let scenario={moment:0,launch:false,work:'ups',workDone:{ups:false,cooling:false},incident:1,teamView:'people',handover:false,demand:800,expansion:true,audience:'operator',record:0,layer:'overview'};
  let camera,animationId=0,dirty=true,pendingViewport=null,anchor=null,lastFrame=0,lastRender=0;
  let lastScene={objects:[],actors:[],props:[],labels:[],facts:[]};
  const transitions={door:0,coolingDoor:0,wing:0,live:0,heat:0,handover:0};
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduced=()=>motion.matches||document.documentElement.classList.contains('reduce-motion')||['reduced','reduce'].includes(document.documentElement.dataset.motion);
  const lerp=(a,b,t)=>a+(b-a)*t;
  const I=()=>new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
  function mm(a,b){const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)o[c*4+r]+=a[k*4+r]*b[c*4+k];return o;}
  function matrix(x=0,y=0,z=0,ry=0,rx=0,rz=0,s=1){
    const cy=Math.cos(ry),sy=Math.sin(ry),cx=Math.cos(rx),sx=Math.sin(rx),cz=Math.cos(rz),sz=Math.sin(rz);
    const a=new Float32Array([cy,0,-sy,0,0,1,0,0,sy,0,cy,0,x,y,z,1]);
    const b=new Float32Array([1,0,0,0,0,cx,sx,0,0,-sx,cx,0,0,0,0,1]);
    const c=new Float32Array([cz,sz,0,0,-sz,cz,0,0,0,0,1,0,0,0,0,1]);
    const out=mm(mm(a,b),c),sc=Array.isArray(s)?s:[s,s,s];
    for(let i=0;i<3;i++)for(let r=0;r<3;r++)out[i*4+r]*=sc[i];return out;
  }
  function transform(p,m,w=1){return [m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12]*w,m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13]*w,m[2]*p[0]+m[6]*p[1]+m[10]*p[2]+m[14]*w];}
  function boneMatrix(a,b){
    const up=norm(sub(b,a)),right=norm(cross(up,Math.abs(up[2])>.98?[1,0,0]:[0,0,1])),forward=cross(right,up);
    return new Float32Array([...right,0,...up,0,...forward,0,...a,1]);
  }
  function limbJoint(start,end,upper,lower,bend){
    const delta=sub(end,start),distance=clamp(Math.hypot(...delta),.001,upper+lower-.0001),direction=norm(delta);
    const along=(upper*upper-lower*lower+distance*distance)/(2*distance);
    const perpendicular=norm(sub(bend,mul(direction,dot(bend,direction))));
    return add(add(start,mul(direction,along)),mul(perpendicular,Math.sqrt(Math.max(0,upper*upper-along*along))));
  }
  const around=(p,angle)=>mm(matrix(...p,angle),matrix(...p.map(v=>-v)));
  function getCamera(){
    const dir=[Math.sin(state.yaw)*Math.cos(state.elev),Math.sin(state.elev),Math.cos(state.yaw)*Math.cos(state.elev)];
    const right=norm([dir[2],0,-dir[0]]),up=cross(dir,right),corners=[];
    for(const x of [-8.5,lerp(8.2,13.9,transitions.wing)])for(const y of [-.55,lerp(3.8,6.6,transitions.wing)])for(const z of [-5.9,8.9])corners.push([x,y,z]);
    const xx=corners.map(p=>dot(p,right)),yy=corners.map(p=>dot(p,up));
    const minx=Math.min(...xx),maxx=Math.max(...xx),miny=Math.min(...yy),maxy=Math.max(...yy);
    const fitHeight=scenario.presentation==='hero'?.94:.81;
    // In the hero the camera controls own a band along the bottom edge: fit the drawing above it.
    const avail=Math.max(80,state.height-chromeReserve());
    const scale=Math.min(state.width*.96/(maxx-minx),avail*fitHeight/(maxy-miny))*state.zoom;
    return {dir,right,up,scale,cx:state.width*.50-(minx+maxx)*.5*scale,cy:avail*.51+(miny+maxy)*.5*scale};
  }
  const project=p=>[camera.cx+dot(p,camera.right)*camera.scale,camera.cy-dot(p,camera.up)*camera.scale,dot(p,camera.dir)];
  const VS=`
    attribute vec3 a_position;attribute vec3 a_normal;attribute vec3 a_color;
    attribute vec2 a_uv;attribute float a_pattern;attribute float a_emission;
    uniform mat4 u_model;uniform vec3 u_right,u_up,u_dir;uniform vec4 u_frame;uniform vec2 u_view;
    varying vec3 v_color;varying vec3 v_normal;varying vec2 v_uv;varying float v_pattern,v_emission;
    void main(){
      vec3 p=(u_model*vec4(a_position,1.0)).xyz;
      vec2 screen=vec2(u_frame.x+dot(p,u_right)*u_frame.z,u_frame.y-dot(p,u_up)*u_frame.z);
      gl_Position=vec4(screen.x/u_view.x*2.0-1.0,1.0-screen.y/u_view.y*2.0,-dot(p,u_dir)/60.0,1.0);
      v_color=a_color;v_normal=normalize(mat3(u_model)*a_normal);v_uv=a_uv;v_pattern=a_pattern;v_emission=a_emission;
    }`;
  const FS=`
    precision mediump float;
    varying vec3 v_color,v_normal;varying vec2 v_uv;varying float v_pattern,v_emission;
    uniform vec4 u_tint;uniform float u_alpha,u_live,u_load,u_fault;
    void main(){
      vec3 n=normalize(v_normal);float light=0.65+max(0.0,dot(n,normalize(vec3(-0.6,1.1,0.65))))*0.38+max(n.y,0.0)*0.06;
      vec3 c=mix(v_color,u_tint.rgb,u_tint.a);float emit=v_emission;
      if(v_pattern>0.5&&v_pattern<1.5){
        float row=fract(v_uv.y*16.0);float ports=step(0.36,fract(v_uv.x*9.0));
        float inner=step(0.09,v_uv.x)*step(v_uv.x,0.91);
        c*=1.0-0.48*step(row,0.15)*inner;
        c*=1.0-0.22*step(0.30,row)*step(row,0.70)*ports*inner;
        float led=step(0.065,v_uv.x)*step(v_uv.x,0.12)*step(0.27,row)*step(row,0.61);
        float on=step(v_uv.y,u_load)*u_live;
        c=mix(c,mix(vec3(0.19,0.28,0.22),mix(vec3(0.74,0.93,0.38),vec3(1.0,0.47,0.23),u_fault),on),led);emit=max(emit,led*on);
      }else if(v_pattern>1.5&&v_pattern<2.5){c*=0.64+0.42*step(0.40,fract(v_uv.x*54.0));}
      else if(v_pattern>2.5&&v_pattern<3.5){c*=0.59+0.42*step(0.29,fract(v_uv.y*13.0));}
      else if(v_pattern>3.5){c*=0.53+0.54*step(0.39,fract(v_uv.y*17.0));}
      gl_FragColor=vec4(c*mix(light,1.12,emit),u_alpha);
    }`;
  let gl=null,ctx=null,program=null,attributes={},uniforms={};
  function setupGL(){
    gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false,powerPreference:'low-power'})||canvas.getContext('experimental-webgl');
    if(!gl)return false;
    function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
    program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,VS));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,FS));gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));
    for(const a of ['position','normal','color','uv','pattern','emission'])attributes[a]=gl.getAttribLocation(program,'a_'+a);
    for(const u of ['model','right','up','dir','frame','view','tint','alpha','live','load','fault'])uniforms[u]=gl.getUniformLocation(program,'u_'+u);
    gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
    return true;
  }
  try{setupGL();}catch(_){gl=null;const replacement=canvas.cloneNode(false);canvas.replaceWith(replacement);canvas=replacement;}
  if(!gl)ctx=canvas.getContext('2d',{alpha:true});
  if(!gl&&!ctx)throw new Error('Renderer unavailable');
  const meshCache=new Map(),patterns={rack:1,coil:2,louvers:3,topGrille:4};
  function mesh(fs){
    if(meshCache.has(fs))return meshCache.get(fs);
    const result={faces:fs,count:0};
    if(gl){
      const data=[];
      for(const f of fs){
        const min=[0,1,2].map(a=>Math.min(...f.p.map(p=>p[a]))),max=[0,1,2].map(a=>Math.max(...f.p.map(p=>p[a])));
        const ui=max[0]-min[0]>.001?0:2,vi=max[1]-min[1]>.001?1:2;
        const vertices=f.p.map((p,i)=>[...p,...(f.vn?.[i]||f.n),...f.m.c.map(c=>c/255),(p[ui]-min[ui])/(max[ui]-min[ui]||1),(p[vi]-min[vi])/(max[vi]-min[vi]||1),patterns[f.pattern]||0,f.m.kind==='emissive'?1:0]);
        for(let i=1;i<vertices.length-1;i++)data.push(...vertices[0],...vertices[i],...vertices[i+1]);
      }
      result.buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,result.buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);result.count=data.length/13;
    }
    meshCache.set(fs,result);return result;
  }
  const groups={};
  for(const f of [...floorFaces,...faces]){const key=f.part||f.asset||'structure';(groups[key]||(groups[key]=[])).push(f);}
  for(const [key,fs] of Object.entries(groups))groups[key]=mesh(fs);
  for(const [key,fs] of Object.entries(prefabs))prefabs[key]=mesh(fs);
  for(const p of Object.values(people))for(const part of Object.keys(p))p[part]=mesh(p[part]);
  for(const d of articulated.doors)d.mesh=mesh(d.faces);
  for(const f of articulated.fans)f.mesh=mesh(f.faces);
  function tintFor(asset){
    if(asset==='crah-02'&&scenario.moment===2&&scenario.incident===1)return [.94,.49,.24,.18];
    if(scenario.layer==='power'&&['switchgear','ups-a','ups-b'].includes(asset))return [.78,.92,.43,.24];
    if(scenario.layer==='cooling'&&asset==='crah-02')return [.40,.80,.78,.25];
    if(asset===scenario.selected)return [.79,.92,.5,.17];
    return [0,0,0,0];
  }
  function desired(){
    const maintenance=scenario.moment===1&&!scenario.workDone[scenario.work];
    return {door:maintenance&&scenario.work==='ups'?1:0,coolingDoor:maintenance&&scenario.work==='cooling'?1:0,
      wing:scenario.moment===4&&scenario.expansion||scenario.moment===5&&scenario.record===4?1:0,
      live:scenario.moment!==0||scenario.launch?1:0,heat:scenario.moment===2&&scenario.incident===1?1:0,handover:scenario.handover?1:0};
  }
  function advance(dt){const d=desired();for(const k of Object.keys(transitions)){
    const v=reduced()||state.paused?d[k]:lerp(transitions[k],d[k],1-Math.exp(-dt*(k==='wing'?2.0:4.2)));
    transitions[k]=Math.abs(v-d[k])<.001?d[k]:v;
  }}

  function buildScene(){
    const scene={objects:[],actors:[],props:[],labels:[],facts:[]},t=state.time,m=scenario.moment;
    function object(mesh,mat=I(),options={}){if(mesh)scene.objects.push({mesh,matrix:mat,alpha:1,...options});}
    function prop(name,x,z,ry=0,y=0,s=1,options={}){
      object(prefabs[name],matrix(x,y,z,ry,0,0,s),options);scene.props.push(name);
    }
    function label(text,point,tone='lime'){scene.labels.push({text,point,tone});}
    function actor(id,role,x,z,yaw=0,pose='tablet',phase=0){
      const body=people[role]||people.engineer,working=pose==='work',walking=pose==='walk',kneel=pose==='kneel',tablet=pose==='tablet';
      const cycle=t*3.6+phase,gait=walking?Math.sin(cycle):0,gesture=working||kneel?Math.sin(t*1.7+phase)*.014:0;
      const stature=.98+(id.length%5)*.01,rootMat=matrix(x,0,z,yaw,0,0,stature);
      const hip=[0,kneel?.48:walking?.922-Math.cos(cycle*2)*.010:.94,kneel?-.05:0];
      const torso=matrix(...hip,walking?gait*.024:0,kneel?.17:working?.11:tablet?.065:.025);
      object(prefabs.shadow,matrix(x,0,z,0,0,0,[.75,1,kneel?.95:.63]));
      object(body.pelvis,mm(rootMat,matrix(...hip)));
      object(body.torso,mm(rootMat,torso));
      object(body.head,mm(mm(rootMat,torso),matrix(0,.581,0,walking?-gait*.024:0,tablet?.19:working||kneel?.10:0)));
      for(const side of [-1,1]){
        const step=cycle+(side===-1?Math.PI:0),lift=walking?Math.max(0,Math.sin(step))*.065:0;
        const foot=[side*(kneel?.12:.105),.145+lift,kneel?(side===1?.39:-.43):walking?Math.cos(step)*.215:.025];
        const thigh=add(hip,[side*.094,0,0]),knee=limbJoint(thigh,foot,.40,.40,kneel&&side===-1?[0,-1,.08]:[0,0,1]);
        object(body.thigh,mm(rootMat,boneMatrix(thigh,knee)));
        object(body.shin,mm(rootMat,boneMatrix(knee,foot)));
        object(body.boot,mm(rootMat,matrix(foot[0],lift,foot[2],side*.045,walking?Math.max(0,Math.sin(step))*.12:0)));
        const shoulder=transform([side*.205,.447,.006],torso);
        const wrist=tablet?[side*.151,1.089,.444]:kneel?[side*.155,.77,.445+side*gesture]:
          working?[side*.168,1.185+gesture,.453+side*gesture]:[side*.243,.915+Math.abs(gait)*.018,.055-gait*side*.17];
        const elbow=limbJoint(shoulder,wrist,.29,.265,[side*.8,-1,-.16]);
        object(body.upperArm,mm(rootMat,boneMatrix(shoulder,elbow)));
        object(body.forearm,mm(rootMat,boneMatrix(elbow,wrist)));
        const fingerDirection=tablet?[0,.65,.7]:working||kneel?[0,.08,1]:[0,-1,.10];
        object(body.hand,mm(rootMat,boneMatrix(wrist,add(wrist,fingerDirection))));
      }
      if(tablet)object(prefabs['field-tablet'],mm(rootMat,matrix(0,1.02,.39,Math.PI,-.80)));
      if(working||kneel)object(prefabs['service-tool'],mm(rootMat,matrix(.168,kneel?.78:1.19+gesture,.51,0,Math.PI/2)));
      scene.actors.push({id,role,pose,position:[x,0,z]});
    }
    function patrol(id,role,a,b,offset=0){
      const cycle=(t/14+offset)%1,progress=cycle<.5?cycle*2:2-cycle*2;
      const x=lerp(a[0],b[0],progress),z=lerp(a[1],b[1],progress),yaw=Math.atan2(b[0]-a[0],b[1]-a[1])+(cycle>.5?Math.PI:0);
      actor(id,role,x,z,yaw,'walk',offset*4);
    }
    const live=transitions.live,wing=transitions.wing;
    for(const [id,group] of Object.entries(groups)){
      if(id.startsWith('wing-')){
        if(wing<.005)continue;
        const fit=clamp((wing-.22)/.78,0,1),shell=clamp((wing-.06)/.94,.01,1);
        object(group,id==='wing-shell'?matrix(0,0,0,0,0,0,[1,shell,1]):id==='wing-fitout'?matrix(0,(1-fit)*1.6,0,0,0,0,[1,Math.max(.01,fit),1]):I(),{asset:'expansion',alpha:id==='wing-fitout'?fit:Math.min(1,wing*3),live:.48});
      }else object(group,I(),{asset:id,live});
    }
    for(const s of shadows){if(s.x>8)continue;object(prefabs.shadow,matrix(s.x,0,s.z,0,0,0,[s.w*1.45,1,s.d*1.43]),{alpha:.25});}
    for(const d of articulated.doors){
      const angle=d.id==='ups-b'?transitions.door*1.33:d.id==='crah-02'?transitions.coolingDoor*1.05:0;
      object(d.mesh,around(d.pivot,-angle),{asset:d.id});
    }
    for(const f of articulated.fans){
      const front=f.point[2]>0,stopped=m===0&&!scenario.launch||m===2&&scenario.incident===1&&front;
      const angle=stopped?0:t*(front?4.8:7.2);
      object(f.mesh,around(f.point,angle),{asset:'crah-02'});
    }
    if(m===0){
      scene.caption=scenario.launch?'Tests accepted. The first racks are live.':'Commissioning crews are testing the facility.';
      if(!scenario.launch){
        actor('cx-electrical','engineer',-4.8,4.47,Math.PI,'work');
        actor('cx-cooling','engineer',5.20,4.85,Math.PI,'kneel');
        actor('cx-lead','outgoing',.25,1.42,.55,'tablet');
        prop('loadbank',.3,3.32);prop('ladder',3.66,.24,.25);
        prop('toolcart',3.5,4.7);prop('crate',-.10,6.85);prop('crate',-.90,6.90,.15);
        prop('barrier',1.95,4.95);prop('cone',4.22,4.64);prop('cone',6.43,4.75);
        label('Cooling acceptance test',[5.4,2.6,3.65],'amber');label('Load testing',[.35,1.65,3.4]);
        scene.facts=['3 commissioning crew','Temporary test equipment','Racks awaiting acceptance'];
      }else{
        patrol('cx-departing','engineer',[-4.8,4.75],[-4.8,7.1]);
        actor('cx-signed','outgoing',.2,1.4,.45,'tablet');
        prop('trolley',1.7,6.6);label('Accepted · equipment energized',[1.1,3.0,-.4]);
        for(let i=0;i<4;i++)prop('air-arrow',4.05-i*.70,.65,Math.PI/2,1.6,.9,{alpha:.8});
        scene.facts=['Acceptance signed','Temporary equipment removed','Cooling online'];
      }
    }
    if(m===1){
      const cooling=scenario.work==='cooling',done=scenario.workDone[scenario.work],x=cooling?6.0:-2.65;
      scene.caption=done?'Work complete. Equipment closed and the area cleared.':cooling?'Cooling service: a technician changes the filter.':'UPS inspection: the panel opens for the technician.';
      patrol('duty-operator','outgoing',[-6.2,1.26],[-1.10,1.26],.1);
      if(!done){
        actor('assigned-technician','engineer',x,cooling?4.95:4.45,Math.PI,'kneel');
        actor('work-supervisor','vendor',cooling?3.00:-.52,4.28,-1.0,'tablet');
        prop('toolcart',cooling?3.76:-.78,4.9);prop('barrier',x,5.46);
        prop('cone',x-.99,4.42);prop('cone',x+.99,5.2);
        if(cooling)prop('filter',4.02,4.2,-.3);
        else prop('loadbank',-4.0,5.05);
        label(cooling?'Filter replacement':'Open panel · inspection',[x,2.40,4.42],'amber');
        scene.facts=['Equipment opened','Technician + reserved part','Work zone protected'];
      }else{
        patrol('technician-clearing','engineer',[x,5.0],[.15,7.05],.2);
        prop('toolcart',1.25,7.08);label('Service recorded',[x,2.20,3.8]);
        scene.facts=['Equipment restored','Work area cleared','Evidence attached'];
      }
    }
    if(m===2){
      const fault=scenario.incident===1,recovered=scenario.incident===2;
      scene.caption=fault?'Cooling fault. Responders arrive while Hall 02 heats up.':recovered?'Recovery verified. Fans restart and the hall cools.':'Normal operation. Cooling serves both data halls.';
      actor('incident-lead','outgoing',1.55,2.60,.6,'tablet');
      if(fault){
        actor('plant-responder','responder',5.23,4.82,Math.PI,'work');
        patrol('response-runner','responder',[-.5,4.78],[3.22,4.78],.26);
        prop('toolcart',3.65,5.15);prop('beacon',6.55,4.89);prop('cone',4.44,4.81);prop('barrier',5.65,5.7);
        prop('warning',5.46,2.34,state.yaw,2.56+Math.sin(t*2)*.045,1.25);
        for(let row=0;row<2;row++)for(let i=0;i<4;i++){
          prop('heat-wave',.65+i*.73,-1.05-row*1.45+Math.sin(t*1.4+i)*.025,state.yaw,2.57+(t*.27+i*.19)%1.05,.75,{alpha:.55+.2*Math.sin(t*2+i)});
        }
        label('31.2°C · cooling fault',[1.70,4.13,-1.25],'amber');
        scene.facts=['Cooling fan stopped','2 responders dispatched','Heat building in Hall 02'];
      }else if(recovered){
        actor('recovery-engineer','engineer',5.15,4.86,Math.PI,'tablet');
        prop('evidence',4.1,4.65);label('22.6°C · recovery verified',[1.7,3.15,-1.25]);
        scene.facts=['Fans restarted','Temperature recovering','Customer update recorded'];
      }else{
        patrol('incident-watch','engineer',[3.9,1.3],[3.9,4.80],.15);
        scene.facts=['Fans running','Temperature at baseline','Response ready'];
      }
      if(!fault)for(let i=0;i<5;i++){const p=(t*.5+i*.55)%3;prop('air-arrow',4.40-p,1.0,Math.PI/2,1.93,.75,{alpha:.6});}
    }
    if(m===3){
      const handed=scenario.handover,p=transitions.handover,view=scenario.teamView;
      scene.caption=view==='vendors'?'Service partners arrive with the next team.':view==='parts'?'The spares inventory moves into the new team’s care.':handed?'The incoming team takes over. The site history stays.':'Outgoing and incoming teams meet on the same site.';
      prop('table',.2,3.2);prop('board',1.65,3.4,-.18);
      actor('outgoing-manager','outgoing',lerp(-.8,-5.8,p),lerp(3.85,6.8,p),handed?-Math.PI/2:2.0,handed?'walk':'tablet');
      actor('incoming-manager','incoming',.3,2.32,0,'tablet');
      actor('incoming-technician','incoming',lerp(1.37,2.65,p),lerp(4.03,1.34,p),Math.PI,handed?'work':'tablet');
      if(view==='vendors'){
        prop('van',4.20,7.02,-Math.PI/2,0,.76);prop('toolcart',3.4,5.0);
        patrol('arriving-vendor','vendor',[3.40,6.18],[3.4,3.83],.1);
        label('Approved service partner',[4.20,2.0,7.05]);scene.facts=['New team on site','Vendor van + specialist','Coverage handed over'];
      }else if(view==='parts'){
        prop('shelf',4.0,4.4,-.4);prop('trolley',2.62,5.8);prop('crate',5.95,5.1);
        actor('spares-coordinator','vendor',3.0,4.58,Math.PI/2,'work');
        label('Critical spares · stock check',[4.0,2.45,4.45]);scene.facts=['New team on site','Spares counted','Compatible parts retained'];
      }else{
        prop('van',-3.8,7.02,-Math.PI/2,0,.76);
        label(handed?'Incoming team on duty':'Site induction & handover',[.4,2.45,3.15]);
        scene.facts=handed?['Incoming team at work','Outgoing team departing','248 site records retained']:['Two teams on site','Shared procedures & history','Inductions in progress'];
      }
    }
    if(m===4){
      scene.caption=scenario.expansion?'The next hall takes shape while the original facility stays live.':'Customer demand grows inside the existing data halls.';
      actor('capacity-manager','outgoing',1.65,1.27,.4,'tablet');
      label(`${Math.round(scenario.demand/10)}% of customer contract`,[2.0,3.25,-1.15],scenario.demand>1000?'amber':'lime');
      if(wing>.01){
        const scale=clamp(wing*1.3,0,1);
        prop('crane-base',12.78,1.1,0,0,scale,{alpha:Math.min(1,wing*3)});
        const boomYaw=.17+Math.sin(t*.19)*.16;
        object(prefabs['crane-boom'],matrix(12.78,5.0*scale,1.1,boomYaw,0,0,scale));scene.props.push('crane-boom');
        const hook=transform([-3.10,0,0],matrix(12.78,5.0,1.1,boomYaw));
        const loadY=1.25+Math.sin(t*.34)*.28;
        // The suspended rack, hook and two lifting straps move as one assembly.
        const line=(a,b,r,mat)=>{
          const delta=sub(b,a),length=Math.hypot(...delta),yaw=Math.atan2(delta[0],delta[2]),pitch=Math.acos(clamp(delta[1]/(length||1),-1,1));
          object(prefabs['unit-cable'],matrix(...a,yaw,pitch,0,[r,length,r]),{tint:mat});
        };
        line([hook[0],loadY+2.02,hook[2]],[hook[0],4.98,hook[2]],1,[0,0,0,0]);
        for(const dx of [-.33,.33])line([hook[0]+dx,loadY+1.67,hook[2]],[hook[0],loadY+2.02,hook[2]],.7,[.9,.7,.3,.5]);
        object(prefabs.newrack,matrix(hook[0],loadY,hook[2],boomYaw,0,0,.70),{asset:'expansion',live:0});scene.props.push('suspended-rack');
        prop('barrier',8.95,4.37);prop('barrier',11.55,4.37);prop('cone',7.9,4.4);
        prop('van',9.80,6.42,-Math.PI/2,0,.72);prop('crate',11.8,5.43);prop('trolley',8.35,5.38);
        actor('expansion-supervisor','engineer',8.66,3.44,.4,'tablet');
        actor('rack-installer','responder',10.73,2.28,Math.PI,'work');
        patrol('delivery-crew','engineer',[8.04,6.05],[8.04,3.12],.19);
        label('Hall 03 · fit-out in progress',[10.1,3.7,-2.2],'amber');
        scene.facts=['Crane lifting new racks','3 installation crew','Existing halls remain live'];
      }else{
        prop('table',.25,3.35);prop('board',1.75,3.35);
        actor('customer-planning','customer',.75,4.25,Math.PI,'tablet');
        scene.facts=['Customer capacity review','Demand changes rack load','Expansion available to preview'];
      }
    }
    if(m===5){
      const audience=scenario.audience,record=scenario.record;
      scene.caption=audience==='customer'?'A customer visits their hall and its operating record.':audience==='insurer'?'An insurer reviews the plant, protection and service history.':audience==='acquirer'?'A new owner tours the facility with its history intact.':'An evidence-led site walk connects the records to the equipment.';
      prop('evidence',-3.65,4.46);prop('evidence',3.64,1.12);prop('evidence',6.55,4.55);
      const destination=audience==='customer'?[2.10,1.50]:audience==='insurer'?[4.03,4.78]:[-.18,3.45];
      actor('site-guide','outgoing',destination[0]-.78,destination[1],.65,'tablet');
      actor('visiting-reviewer',audience==='customer'?'customer':'auditor',destination[0]+.20,destination[1]+.52,Math.PI+.4,'tablet');
      if(audience==='acquirer')actor('incoming-owner','customer',destination[0]+1.04,destination[1]+.33,Math.PI,'tablet');
      if(audience==='operator')patrol('record-owner','engineer',[-6,1.24],[-1.1,1.24],.17);
      if(record===0){prop('board',-5.7,4.8);label('Acceptance evidence',[-4.4,2.55,3.25]);}
      if(record===1){prop('toolcart',-2.03,5.10);actor('maintenance-record','engineer',-2.78,4.5,Math.PI,'tablet');label('Maintenance verified',[-2.7,2.5,3.8]);}
      if(record===2){prop('beacon',5.85,4.72);actor('incident-review','vendor',5.14,4.73,Math.PI,'tablet');label('Cooling recovery record',[5.1,2.7,3.6]);}
      if(record===3){prop('table',.2,4.7);actor('handover-record','incoming',.65,5.48,Math.PI,'tablet');label('Handover history',[.15,2.5,4.3]);}
      if(record===4){actor('expansion-record','engineer',10.10,2.4,Math.PI,'tablet');prop('evidence',8.80,3.34);label('Proposed Hall 03 · review',[10.10,3.40,-.4],'amber');}
      scene.facts=[audience==='acquirer'?'Acquisition site tour':audience==='insurer'?'Insurance site review':audience==='customer'?'Customer site visit':'Evidence walk-through',['Acceptance','Maintenance','Incident recovery','Team handover','Expansion review'][record],`${record+1} / 5 history moments`];
    }
    // The optional layers expose physical flows without replacing the active scene.
    if(scenario.layer==='power'){
      for(let i=0;i<7;i++){const z=3.1-(t*.45+i*.56)%3.3;prop('air-arrow',-.68,z,Math.PI,.17,.75,{tint:[.82,.95,.45,.85]});}
    }
    if(scenario.layer==='cooling'&&!(m===2&&scenario.incident===1)){
      for(let i=0;i<5;i++)prop('air-arrow',4.45-(t*.45+i*.65)%3.6,.48,Math.PI/2,2.0,.72,{alpha:.7});
    }
    if(scenario.layer==='evidence'&&m!==5)for(const [x,z] of [[-3.6,4.2],[3.7,.9],[6.5,4.65]])prop('evidence',x,z);
    if(scenario.layer==='people')for(const a of scene.actors)object(prefabs.shadow,matrix(a.position[0],.02,a.position[2],0,0,0,[1.7,1,1.7]),{tint:[.82,.95,.46,1],alpha:.5});
    return scene;
  }

  function drawGL(scene){
    gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(program);
    gl.uniform3fv(uniforms.right,camera.right);gl.uniform3fv(uniforms.up,camera.up);gl.uniform3fv(uniforms.dir,camera.dir);
    gl.uniform4f(uniforms.frame,camera.cx,camera.cy,camera.scale,0);gl.uniform2f(uniforms.view,state.width,state.height);
    const opaque=scene.objects.filter(o=>o.alpha>=.999),transparent=scene.objects.filter(o=>o.alpha<.999&&o.alpha>.005);
    transparent.sort((a,b)=>dot(transform(a.mesh.faces[0]?.c||[0,0,0],a.matrix),camera.dir)-dot(transform(b.mesh.faces[0]?.c||[0,0,0],b.matrix),camera.dir));
    function draw(o){
      gl.bindBuffer(gl.ARRAY_BUFFER,o.mesh.buffer);let offset=0;
      for(const [name,size] of [['position',3],['normal',3],['color',3],['uv',2],['pattern',1],['emission',1]]){
        const attr=attributes[name];if(attr>=0){gl.enableVertexAttribArray(attr);gl.vertexAttribPointer(attr,size,gl.FLOAT,false,52,offset*4);}offset+=size;
      }
      gl.uniformMatrix4fv(uniforms.model,false,o.matrix);gl.uniform4fv(uniforms.tint,o.tint||tintFor(o.asset));
      gl.uniform1f(uniforms.alpha,o.alpha);gl.uniform1f(uniforms.live,o.live??transitions.live);
      gl.uniform1f(uniforms.load,scenario.moment===4&&o.asset==='hall-2'?clamp(scenario.demand/1400,.22,1):1);
      gl.uniform1f(uniforms.fault,scenario.moment===2&&scenario.incident===1&&o.asset==='hall-2'?1:0);
      gl.drawArrays(gl.TRIANGLES,0,o.mesh.count);
    }
    gl.depthMask(true);for(const o of opaque)draw(o);
    gl.depthMask(false);for(const o of transparent)draw(o);gl.depthMask(true);
  }
  function path2(context,ps){context.beginPath();for(let i=0;i<ps.length;i++)i?context.lineTo(ps[i][0],ps[i][1]):context.moveTo(ps[i][0],ps[i][1]);context.closePath();}
  function drawSoftware(scene){
    ctx.setTransform(canvas.width/state.width,0,0,canvas.height/state.height,0,0);ctx.clearRect(0,0,state.width,state.height);
    const visible=[];
    for(const o of scene.objects){if(o.alpha<.02)continue;for(const f of o.mesh.faces){
      const n=norm(transform(f.n,o.matrix,0));if(dot(n,camera.dir)<.0001)continue;
      const wp=f.p.map(p=>transform(p,o.matrix)),ps=wp.map(project);
      visible.push({f,o,n,ps,z:dot(transform(f.c,o.matrix),camera.dir)});
    }}
    visible.sort((a,b)=>a.z-b.z);
    for(const {f,o,n,ps} of visible){
      const tint=o.tint||tintFor(o.asset),c=f.m.c.map((v,i)=>v*(1-tint[3])+tint[i]*255*tint[3]);
      const light=.65+Math.max(0,dot(n,SUN))*.38+Math.max(n[1],0)*.06;
      ctx.globalAlpha=o.alpha;path2(ctx,ps);ctx.fillStyle=rgb(c,light);ctx.fill();
      if(f.pattern&&ps.length===4){
        ctx.save();path2(ctx,ps);ctx.clip();
        const p=f.p,rows=f.pattern==='rack'?16:12;
        const bottom=p.filter(p=>p[1]===Math.min(...f.p.map(v=>v[1]))).sort((a,b)=>a[0]-b[0]),top=p.filter(p=>p[1]===Math.max(...f.p.map(v=>v[1]))).sort((a,b)=>a[0]-b[0]);
        if(bottom.length===2&&top.length===2)for(let row=1;row<rows;row++){
          const a=project(transform(add(mul(bottom[0],1-row/rows),mul(top[0],row/rows)),o.matrix));
          const b=project(transform(add(mul(bottom[1],1-row/rows),mul(top[1],row/rows)),o.matrix));
          ctx.beginPath();ctx.moveTo(...a.slice(0,2));ctx.lineTo(...b.slice(0,2));ctx.lineWidth=.65;ctx.strokeStyle='#14271c99';ctx.stroke();
          if(f.pattern==='rack'&&transitions.live>.5){ctx.fillStyle=scenario.moment===2&&scenario.incident===1&&o.asset==='hall-2'?'#f3a464':'#d2e985';ctx.fillRect(a[0]+(b[0]-a[0])*.13,a[1]+(b[1]-a[1])*.13,1.1,1);}
        }
        ctx.restore();
      }
    }
    ctx.globalAlpha=1;
  }
  let captionKey='',factsKey='';
  const labelSeen=new Map();
  function placeLabel(p,w,h,obstacles,seen){
    const top=75,bottom=state.height-114,fit=(x,y)=>({x:clamp(x,12,state.width-w-12),y:clamp(y,top,bottom)});
    const tries=[[p[0]-w/2,p[1]-38],[p[0]-w/2,p[1]-74],[p[0]-w/2,p[1]+18],[p[0]+16,p[1]-h/2],[p[0]-w-16,p[1]-h/2],[p[0]-w*.15,p[1]-38],[p[0]-w*.85,p[1]-38],[p[0]-w/2,p[1]-110],[p[0]-w/2,p[1]+54],[p[0]+16,p[1]-h-20],[p[0]-w-16,p[1]-h-20]];
    const cost=s=>{let c=0;for(const o of obstacles){const ox=Math.min(s.x+w,o.x+o.w)-Math.max(s.x,o.x)+4,oy=Math.min(s.y+h,o.y+o.h)-Math.max(s.y,o.y)+4;if(ox>0&&oy>0)c+=ox*oy;}return c;};
    const kept=seen.slot>=0&&fit(...tries[seen.slot]);if(kept&&!cost(kept))return kept;   // stay put while the spot is still clear
    for(let i=0;i<tries.length;i++){const s=fit(...tries[i]);if(!cost(s)){seen.slot=i;return s;}}
    // Crowded (a small scene): the clear spot nearest the point, or else the least covered one.
    const held=seen.slot<0&&fit(p[0]+seen.dx,p[1]+seen.dy);if(held&&!cost(held))return held;
    const span=(a,b,step)=>{const v=[];for(let n=a;n<b;n+=step)v.push(n);v.push(b);return v;};
    let best=fit(...tries[0]),bestCost=Infinity,bestD=Infinity;
    for(const y of span(top,bottom,3))for(const x of span(12,state.width-w-12,6)){
      const s=fit(x,y),c=cost(s);if(c>bestCost)continue;
      const d=Math.hypot(s.x+w/2-p[0],s.y+h/2-p[1]);if(c<bestCost||d<bestD){best=s;bestCost=c;bestD=d;}
    }
    seen.slot=-1;seen.dx=best.x-p[0];seen.dy=best.y-p[1];
    return best;
  }
  function overlay(scene){
    fx.setTransform(fxCanvas.width/state.width,0,0,fxCanvas.height/state.height,0,0);fx.clearRect(0,0,state.width,state.height);
    const compact=state.width<560;
    const chosen=compact?scene.labels.slice(0,1):scene.labels;
    const pinRects=updatePins(),labelRects=[],now=performance.now(),live=new Set();
    let fading=false;
    for(const l of chosen){
      const p=project(l.point),text=l.text,fs=compact?11:12;
      fx.font=`500 ${fs}px Arial`;const w=fx.measureText(text).width+22,h=29;
      const seen=labelSeen.get(text)||{born:now,slot:0};labelSeen.set(text,seen);live.add(text);
      const {x,y}=placeLabel(p,w,h,[...pinRects,...labelRects],seen);
      // A label that has to jump to a new spot fades in there instead of teleporting.
      const off=[x-p[0],y-p[1]];if(seen.off&&Math.hypot(off[0]-seen.off[0],off[1]-seen.off[1])>12)seen.born=now;seen.off=off;
      labelRects.push({x,y,w,h});
      const alpha=reduced()?1:Math.min(1,(now-seen.born)/280);if(alpha<1)fading=true;
      const lx=y+h<=p[1]||y>=p[1]?clamp(p[0],x+10,x+w-10):p[0]<x?x:x+w,ly=y+h<=p[1]?y+h:y>=p[1]?y:clamp(p[1],y+6,y+h-6);
      fx.save();fx.globalAlpha=alpha;
      fx.beginPath();fx.moveTo(p[0],p[1]);fx.lineTo(lx,ly);fx.lineWidth=1;fx.strokeStyle=l.tone==='amber'?'#e7b582bb':'#dbeab099';fx.stroke();
      fx.fillStyle='#10291fec';fx.strokeStyle=l.tone==='amber'?'#dba66b99':'#aac98480';fx.lineWidth=1;fx.beginPath();
      if(fx.roundRect)fx.roundRect(x,y,w,h,4);else fx.rect(x,y,w,h);fx.fill();fx.stroke();
      fx.fillStyle=l.tone==='amber'?'#ffcd98':'#e8f3cb';fx.textAlign='left';fx.textBaseline='middle';fx.fillText(text,x+11,y+h/2);
      fx.beginPath();fx.arc(p[0],p[1],2.3,0,Math.PI*2);fx.fill();
      fx.restore();
    }
    for(const k of [...labelSeen.keys()])if(!live.has(k))labelSeen.delete(k);
    if(fading)requestRender();
    const cap=$('.life-scene-caption'),facts=$('.life-scene-facts');
    if(cap&&captionKey!==scene.caption){cap.textContent=scene.caption;captionKey=scene.caption;}
    const nextFacts=scene.facts.join('|');
    if(facts&&factsKey!==nextFacts){facts.replaceChildren(...scene.facts.map(s=>{const span=document.createElement('span');span.textContent=s;return span;}));factsKey=nextFacts;}
  }
  function updatePins(){
    let ids=scenario.layer==='power'?['switchgear','ups-b']:scenario.layer==='cooling'?['crah-02','hall-2']:scenario.layer==='evidence'?['switchgear','hall-2','crah-02']:scenario.layer==='people'?[]:[['switchgear','hall-1'],['hall-1'],['hall-1'],['hall-1','crah-02'],['hall-1'],['hall-1']][scenario.moment];
    ids=[...ids];if(scenario.selected&&!ids.includes(scenario.selected))ids.push(scenario.selected);
    const at=[],placed=[];
    $$('[data-life-asset]').forEach(pin=>{
      const id=pin.dataset.lifeAsset,p=project(targets[id].point),shown=ids.includes(id)&&(id!=='expansion'||transitions.wing>.7);
      pin.hidden=!shown;pin.style.opacity=shown?'1':'0';pin.style.pointerEvents=shown?'auto':'none';
      pin.setAttribute('aria-pressed',String(id===scenario.selected));
      at.push({pin,shown,L:clamp(p[0],15,state.width-110),T:clamp(p[1],80,state.height-115)});
    });
    // Dots mark equipment and never move, so every visible dot is an obstacle from the start.
    const dots=new Map(at.filter(a=>a.shown).map(a=>[a.pin,{x:a.L-12,y:a.T-6,w:13,h:12}]));
    // A pin whose label would cover one already placed moves its label: to the other side of its
    // point, then just above or below it. A pin keeps its spot while it stays clear, so nothing flickers.
    for(const a of at){
      const {pin,L,T}=a;pin.style.left=L+'px';pin.style.top=T+'px';
      if(!a.shown){pin.classList.remove('is-flipped','pin-up','pin-down');pin.style.removeProperty('--pin-dy');pin.dataset.slot='0';continue;}
      let size=pinSizes.get(pin);if(!size){size={w:pin.offsetWidth,h:pin.offsetHeight};if(size.w)pinSizes.set(pin,size);}
      const w=size.w,h=size.h,dy=h+5;
      const slots=[[0,0],[1,0],[0,-dy],[0,dy],[1,-dy],[1,dy]];
      const rect=([f,d])=>({x:f?L-1-w:L-10,y:T-h/2+d,w,h});
      const others=[...placed,...[...dots].filter(([k])=>k!==pin).map(([,v])=>v)];
      const ok=(slot,m)=>{const b=rect(slots[slot]);return b.x>=4&&b.x+b.w<=state.width-4&&!others.some(o=>b.x<o.x+o.w+m&&b.x+b.w+m>o.x&&b.y<o.y+o.h+m&&b.y+b.h+m>o.y);};
      let slot=+pin.dataset.slot||0;
      if(slot&&ok(0,12))slot=0;
      else if(!ok(slot,3)){const free=slots.findIndex((_,i)=>ok(i,3));slot=free<0?0:free;}
      pin.dataset.slot=String(slot);const [f,d]=slots[slot];
      // Crossing to the other side of the dot can't glide (it would pass over the dot), so the label fades across.
      if(pin.classList.contains('is-flipped')!==!!f&&!reduced())pin.lastElementChild?.animate?.([{opacity:0},{opacity:1}],{duration:240,easing:'cubic-bezier(.2,.7,.2,1)'});
      pin.classList.toggle('is-flipped',!!f);pin.classList.toggle('pin-up',d<0);pin.classList.toggle('pin-down',d>0);
      if(d){pin.style.setProperty('--pin-dy',d+'px');pin.style.setProperty('--pin-dy-abs',Math.abs(d)+'px');}else{pin.style.removeProperty('--pin-dy');pin.style.removeProperty('--pin-dy-abs');}
      const r=rect(slots[slot]);placed.push(r);
      // The hairline between a moved label and its dot is part of the pin too: nothing may sit across it.
      const y0=d>0?T+6:r.y+r.h,y1=d>0?r.y:T-6;if(d&&y1>y0)placed.push({x:L-7,y:y0,w:3,h:y1-y0});
    }
    return [...placed,...dots.values()];
  }
  function syncViewport(){
    if(pendingViewport){Object.assign(state,pendingViewport);pendingViewport=null;}
    // Scroll changes the CSS viewport, not the backing-store allocation. Resizing a canvas clears it.
    const hero=scenario.presentation==='hero';
    const bufferWidth=Math.round((hero?Math.min(window.innerWidth||state.width,1440):state.width)*state.dpr);
    const bufferHeight=Math.round((hero?Math.min(window.innerHeight||state.height,1200):state.height)*state.dpr);
    let changed=false;
    for(const c of [canvas,fxCanvas]){
      if(c.width!==bufferWidth){c.width=bufferWidth;changed=true;}
      if(c.height!==bufferHeight){c.height=bufferHeight;changed=true;}
    }
    if(changed)state.bufferResizes=(state.bufferResizes||0)+1;
  }
  function render(){
    if(!state.visible||state.contextLost)return;
    const start=performance.now();
    // Any necessary backing-store resize and its replacement image are submitted in the same frame.
    syncViewport();camera=getCamera();lastScene=buildScene();
    if(gl)drawGL(lastScene);else drawSoftware(lastScene);
    overlay(lastScene);state.rendered++;state.lastRenderMs=performance.now()-start;
    $('.life-model-loading').hidden=true;canvas.dataset.rendered=String(state.rendered);canvas.dataset.renderer=gl?'webgl':'canvas';
  }
  function moving(){return !state.paused&&!reduced()&&!document.hidden;}
  function requestRender(){
    dirty=true;
    if(!animationId)animationId=requestAnimationFrame(tick);
  }
  let chromeBand=0,pinSizes=new WeakMap();
  addEventListener('resize',()=>{pinSizes=new WeakMap();},{passive:true});
  function measureChrome(){
    const c=$('.life-view-controls');
    if(scenario.presentation!=='hero'||!c){chromeBand=0;return;}
    const r=root.getBoundingClientRect(),b=c.getBoundingClientRect();
    chromeBand=b.height?Math.max(0,r.bottom-b.top+8):0;
  }
  function chromeReserve(){
    const hero=root.closest('.life-hero');if(!hero||!chromeBand)return 0;
    const tools=hero.dataset.lifeMobile==='true'?1:Math.min(1,parseFloat(hero.style.getPropertyValue('--life-tool-opacity'))||0);
    return chromeBand*tools;
  }
  function easeCamera(dt){
    let moving=false;
    for(const k of ['yaw','elev','zoom']){
      const d=view[k]-state[k];if(!d)continue;moving=true;
      state[k]=reduced()||Math.abs(d)<.0005?view[k]:state[k]+d*(1-Math.exp(-dt*12));
    }
    return moving;
  }
  function resize(){
    measureChrome();
    const r=root.getBoundingClientRect();if(r.width<1||r.height<1)return;
    const dpr=Math.min(window.devicePixelRatio||1,1.5);
    if(!pendingViewport&&Math.abs(state.width-r.width)<.01&&Math.abs(state.height-r.height)<.01&&state.dpr===dpr)return;
    pendingViewport={width:r.width,height:r.height,dpr};requestRender();
  }
  function tick(now){
    animationId=0;
    if(!state.visible||state.contextLost||document.hidden){lastFrame=now;return;}
    const animate=moving(),dt=Math.min(.06,(now-lastFrame)/1000||.033);lastFrame=now;
    if(animate){state.time+=dt;advance(dt);}
    const settling=easeCamera(Math.min(dt,.034));
    if(dirty||pendingViewport||settling||animate&&now-lastRender>(gl?33:160)){
      dirty=false;render();lastRender=now;
    }
    if((animate||settling)&&!animationId)animationId=requestAnimationFrame(tick);
  }
  function restart(){
    if(animationId)cancelAnimationFrame(animationId);animationId=0;lastFrame=performance.now();
    if(reduced()||state.paused)advance(1);
    requestRender();
  }
  new ResizeObserver(resize).observe(root);
  new IntersectionObserver(entries=>{state.visible=entries[0].isIntersecting;restart();},{rootMargin:'100px'}).observe(root);
  motion.addEventListener?.('change',restart);
  new MutationObserver(restart).observe(document.documentElement,{attributes:true,attributeFilter:['class','data-motion']});
  document.addEventListener('visibilitychange',restart);
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();state.contextLost=true;if(animationId)cancelAnimationFrame(animationId);});
  canvas.addEventListener('webglcontextrestored',()=>{
    setupGL();for(const [fs,old] of [...meshCache]){meshCache.delete(fs);Object.assign(old,mesh(fs));meshCache.set(fs,old);}state.contextLost=false;restart();
  });
  function inside(x,y,ps){let yes=false;for(let i=0,j=ps.length-1;i<ps.length;j=i++){const a=ps[i],b=ps[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
  function hitAt(x,y){
    const hits=[];for(const o of lastScene.objects){if(!targets[o.asset]||o.alpha<.2)continue;
      for(const f of o.mesh.faces){if(dot(transform(f.n,o.matrix,0),camera.dir)<0)continue;const ps=f.p.map(p=>project(transform(p,o.matrix)));
        if(inside(x,y,ps))hits.push({id:o.asset,z:dot(transform(f.c,o.matrix),camera.dir)});
      }
    }
    hits.sort((a,b)=>b.z-a.z);return hits[0]?.id;
  }
  canvas.addEventListener('pointerdown',e=>{
    if(e.button!==0)return;anchor={x:e.clientX,y:e.clientY,yaw:state.yaw,elev:state.elev,id:e.pointerId,moved:false};
    if(e.pointerType==='mouse'){state.drag=true;canvas.setPointerCapture(e.pointerId);canvas.classList.add('dragging');}
  });
  canvas.addEventListener('pointermove',e=>{
    if(!anchor||anchor.id!==e.pointerId)return;const dx=e.clientX-anchor.x,dy=e.clientY-anchor.y;
    if(Math.abs(dx)+Math.abs(dy)>6)anchor.moved=true;
    if(!state.drag&&Math.abs(dx)>8&&Math.abs(dx)>Math.abs(dy)*1.1){state.drag=true;canvas.setPointerCapture(e.pointerId);canvas.classList.add('dragging');}
    if(state.drag){state.yaw=view.yaw=clamp(anchor.yaw-dx*.004,.1,1.34);state.elev=view.elev=clamp(anchor.elev+dy*.002,.35,.96);requestRender();}
  });
  function endPointer(e){
    if(!anchor||anchor.id!==e.pointerId)return;const moved=anchor.moved;anchor=null;state.drag=false;canvas.classList.remove('dragging');
    if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);
    if(!moved&&e.type!=='pointercancel'){const r=canvas.getBoundingClientRect(),id=hitAt(e.clientX-r.left,e.clientY-r.top);if(id)onSelect(id);}requestRender();
  }
  canvas.addEventListener('pointerup',endPointer);canvas.addEventListener('pointercancel',endPointer);
  canvas.addEventListener('lostpointercapture',()=>{anchor=null;state.drag=false;canvas.classList.remove('dragging');});
  function cameraAction(action){
    if(action==='left')view.yaw=clamp(view.yaw+.12,.1,1.34);if(action==='right')view.yaw=clamp(view.yaw-.12,.1,1.34);
    if(action==='in')view.zoom=clamp(view.zoom+.12,.72,1.9);if(action==='out')view.zoom=clamp(view.zoom-.12,.72,1.9);
    if(action==='reset')Object.assign(view,initialCamera);
    if(action==='pause'){state.paused=!state.paused;const b=$('[data-life-camera="pause"]');if(b){b.setAttribute('aria-pressed',String(state.paused));b.setAttribute('aria-label',state.paused?'Resume scene animation':'Pause scene animation');b.textContent=state.paused?'▷':'Ⅱ';}restart();}
    requestRender();
  }
  canvas.addEventListener('keydown',e=>{
    const map={ArrowLeft:'left',ArrowRight:'right','+':'in','=':'in','-':'out',Home:'reset',' ':'pause'};
    if(map[e.key]){e.preventDefault();cameraAction(map[e.key]);}
    else if(['ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();view.elev=clamp(view.elev+(e.key==='ArrowUp'?.06:-.06),.35,.96);requestRender();}
  });
  resize();
  return Object.freeze({
    update(next){scenario={...scenario,...next,workDone:{...(next.workDone||scenario.workDone)}};advance(reduced()||state.paused?1:.025);requestRender();},
    camera:cameraAction,
    snapshot:()=>({id:'north-campus-dc01',sceneBuilds:1,faces:[...meshCache.values()].reduce((n,m)=>n+m.faces.length,0),frames:state.rendered,
      camera:{yaw:state.yaw,elevation:state.elev,zoom:state.zoom},renderer:gl?'WebGL articulated 3D scene':'Software articulated 3D scene',externalAssets:0,
      actors:lastScene.actors.map(a=>({...a})),props:[...lastScene.props],caption:lastScene.caption,transforms:{...transitions},
      frontFansStopped:scenario.moment===0&&!scenario.launch||scenario.moment===2&&scenario.incident===1,
      paused:state.paused||reduced(),bufferResizes:state.bufferResizes||0,buffer:{width:canvas.width,height:canvas.height},lastRenderMs:Math.round(state.lastRenderMs||0)})
  });
};
