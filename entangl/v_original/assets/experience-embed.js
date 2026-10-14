(()=>{'use strict';
 const mode=new URLSearchParams(location.search).get('view');
 if(mode==='model') document.documentElement.dataset.embed='model';
 window.addEventListener('DOMContentLoaded',()=>{
  if(mode==='model'){
   document.addEventListener('click',e=>{const b=e.target.closest('[data-jump]');if(b){e.preventDefault();e.stopImmediatePropagation();const routes={'live-ops':'/platform/telemetry','field':'/platform/fieldwork','growth':'/platform/portfolio','platform':'/platform/site-model','perspectives':'/platform/visibility'};parent.postMessage({type:'entangl:navigate',route:routes[b.dataset.jump]||'/platform'},location.origin);}},true);
   window.addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==parent)return;if(e.data?.type==='entangl:motion'&&typeof e.data.paused==='boolean'){const toggle=document.querySelector('[data-motion]');if(toggle&&toggle.getAttribute('aria-pressed')!==String(e.data.paused))toggle.click();}if(e.data?.type==='entangl:layer'&&['all','power','cooling','capacity'].includes(e.data.layer)){document.querySelector(`[data-layer="${e.data.layer}"]`)?.click();}});
  }
 });
})();
