/* Motion v2 — ambient life, scene cuts, rituals. One small module; hooks into app.js only via window.MO / window.LJ / DOM.
   Budgets: transform/opacity only for anything continuous; everything stops when the tab is hidden or the table is idle. */
(()=>{'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const sysRM=matchMedia('(prefers-reduced-motion: reduce)');
const prefs=()=>{try{return JSON.parse(localStorage.getItem('sr.prefs'))||{}}catch{return{}}};
/* three levels: full · reduced (system setting) · still (site toggle 减少动效) */
const level=()=>prefs().reduce?'still':sysRM.matches?'reduced':'full';
const setLevel=()=>{document.documentElement.dataset.motion=level()};setLevel();sysRM.addEventListener?.('change',setLevel);
addEventListener('storage',setLevel);
const FULL=()=>level()==='full';
const coarse=matchMedia('(pointer:coarse)').matches;
const lowPower=()=>navigator.connection?.saveData||MO.battLow;

/* ---------- SFX: tiny CC0 samples, fetched on first use, played through the app's own audio context, only when sound is on ---------- */
const SFX={buf:{},pend:{},
 ok(){const S=window.Sound;return S&&S.on&&S.ctx&&S.ctx.state!=='closed'},
 load(n){const S=window.Sound;if(this.buf[n]||this.pend[n]||!S?.ctx)return this.pend[n];
  return this.pend[n]=fetch(`assets/sfx/${n}.mp3`).then(r=>r.arrayBuffer()).then(a=>S.ctx.decodeAudioData(a)).then(b=>this.buf[n]=b).catch(()=>{})},
 play(n,{vol=1,rate=1,at=0}={}){if(!this.ok())return;const S=window.Sound,c=S.ctx,b=this.buf[n];if(!b){this.load(n);return}
  const s=c.createBufferSource();s.buffer=b;s.playbackRate.value=rate*(1+(Math.random()-.5)*.06);const g=c.createGain();g.gain.value=vol*.55*(prefs().vol??.5);
  s.connect(g).connect(c.destination);s.start(c.currentTime+at)},
 warm(...n){if(this.ok())n.forEach(x=>this.load(x))}};
const buzz=ms=>{if(SFX.ok()&&FULL())try{navigator.vibrate?.(ms)}catch{}};
// replace the synthesized tap with a real card-on-felt sample (falls back to the original until it has loaded)
const wrapTap=()=>{const S=window.Sound;if(!S||S._mo)return;const orig=S.tap.bind(S);S._mo=1;
 S.tap=()=>{if(!S.on)return;if(SFX.buf.place)SFX.play(Math.random()<.5?'place':'slide1',{vol:.8});else{SFX.load('place');SFX.load('slide1');orig()}}};

/* ---------- idle / visibility gate ---------- */
let lastInput=performance.now();
const poke=()=>{lastInput=performance.now();Amb.wake()};
['pointerdown','pointermove','keydown','wheel','touchstart','scroll'].forEach(e=>addEventListener(e,poke,{passive:true,capture:true}));
document.addEventListener('visibilitychange',()=>document.hidden?Amb.sleep():Amb.wake());
const idleFor=()=>performance.now()-lastInput;

/* ---------- A1 lamp breathing + A2 dust in the cone ---------- */
const ab=$('#ab');
const amb=document.createElement('div');amb.className='mo-amb';amb.setAttribute('aria-hidden','true');
const cv=document.createElement('canvas');cv.className='mo-dust';cv.setAttribute('aria-hidden','true');
(ab.querySelector(".plate")||ab.firstChild).after(amb,cv);
// 1/f-ish noise: sum of three slow sines with incommensurate periods
const breath=t=>.5*Math.sin(t/7100)+.3*Math.sin(t/11300+1.7)+.2*Math.sin(t/4300+4.1);
const Amb={timer:0,raf:0,motes:[],dip:0,nextDip:0,cw:0,ch:0,ctx:null,frame:0,box:null,
 layout(){const m=ab.classList.contains('m');const W=m?390:1440,H=ab.offsetHeight||900;
  // the cone: apex at the lamp (x≈52%, above the top), widening downwards over the table
  const bw=m?320:760,bh=Math.min(H,m?640:820);this.box={x:W*.52-bw/2,y:0,w:bw,h:bh};
  Object.assign(cv.style,{left:this.box.x+'px',top:'0px',width:bw+'px',height:bh+'px'});
  const sc=(ab.getBoundingClientRect().width/W)||1,dpr=Math.min(1.5,devicePixelRatio||1);
  cv.width=Math.round(bw*sc*dpr);cv.height=Math.round(bh*sc*dpr);this.k=sc*dpr;this.ctx=cv.getContext('2d');
  const n=(m||coarse)?6:10;if(this.motes.length!==n)this.motes=Array.from({length:n},()=>this.mote(true))},
 mote(any){const b=this.box;return{x:Math.random()*b.w,y:any?Math.random()*b.h:-6,r:.6+Math.random()*1.1,vx:(Math.random()-.5)*3,vy:2+Math.random()*3.5,ph:Math.random()*6.28,a:.18+Math.random()*.22}},
 // light intensity of the cone at (x,y) in box space; dust is only visible where lit
 lit(x,y){const b=this.box,half=b.w*(.16+.34*y/b.h),d=Math.abs(x-b.w/2)/half;return d>=1?0:(1-d*d)*(1-.55*y/b.h)},
 sprite:null,
 mkSprite(){const s=document.createElement('canvas');s.width=s.height=16;const g=s.getContext('2d');const gr=g.createRadialGradient(8,8,0,8,8,8);
  gr.addColorStop(0,'rgba(222,208,180,1)');gr.addColorStop(.45,'rgba(222,208,180,.55)');gr.addColorStop(1,'rgba(222,208,180,0)');g.fillStyle=gr;g.fillRect(0,0,16,16);this.sprite=s},
 draw(t){const c=this.ctx,k=this.k,b=this.box;if(!c)return;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,cv.width,cv.height);c.setTransform(k,0,0,k,0,0);
  const dt=1/30;for(const p of this.motes){p.ph+=dt*.35;p.x+=(p.vx+Math.sin(p.ph)*2.2)*dt;p.y+=(p.vy+Math.cos(p.ph*.7)*1.2)*dt;
   if(p.y>b.h+6||p.x<-6||p.x>b.w+6)Object.assign(p,this.mote(false));
   const L=this.lit(p.x,p.y);if(L<=.02)continue;c.globalAlpha=p.a*L;const s=p.r*4;c.drawImage(this.sprite,p.x-s/2,p.y-s/2,s,s)}},
 loop(t){this.raf=0;if(document.hidden)return;const full=FULL()&&!lowPower();
  if(full&&idleFor()<60000&&!/^#\/draw/.test(location.hash)){if((this.frame++&1)===0)this.draw(t);this.raf=requestAnimationFrame(x=>this.loop(x))}else cv.style.opacity='0'},
 tickLamp(){if(document.hidden||level()!=='full'){amb.style.opacity='.035';return}
  const t=performance.now();const busy=t<MO.busy||/^#\/draw/.test(location.hash);amb.classList.toggle('off',busy);if(busy)return;let o=.035-breath(t)*.015;
  if(t>this.nextDip){this.dip=t;this.nextDip=t+40000+Math.random()*50000}
  if(t-this.dip<240)o+=.04;amb.style.opacity=o.toFixed(4);
  if(idleFor()>90000){this.stopLamp()}},
 stopLamp(){clearInterval(this.timer);this.timer=0},
 wake(){if(document.hidden||!this.box)return;if(!this.timer&&level()==='full')this.timer=setInterval(()=>this.tickLamp(),250);
  if(!this.raf&&FULL()){cv.style.opacity='1';this.raf=requestAnimationFrame(x=>this.loop(x))}},
 sleep(){this.stopLamp();cancelAnimationFrame(this.raf);this.raf=0},
 init(){this.mkSprite();this.nextDip=performance.now()+20000;this.layout();this.wake();
  addEventListener('resize',()=>{clearTimeout(this.rt);this.rt=setTimeout(()=>this.layout(),200)})}};

/* ---------- T1 the lamp dims between scenes ---------- */
const veil=document.createElement('div');veil.className='mo-veil';veil.setAttribute('aria-hidden','true');document.body.append(veil);
let cutting=false;
const up=()=>{veil.classList.remove('dn','up');void veil.offsetWidth;veil.classList.add('up');setTimeout(()=>veil.classList.remove('up'),700)};
document.addEventListener('click',e=>{const a=e.target.closest('a[href^="#/"],a[href="#"]');if(!a||e.defaultPrevented||e.metaKey||e.ctrlKey||e.shiftKey||e.button)return;
 const h=a.getAttribute('href');if(h===location.hash||(h==='#/'&&!location.hash)||level()==='still')return;
 e.preventDefault();cutting=true;veil.classList.remove('up');veil.classList.add('dn');setTimeout(()=>{location.hash=h},level()==='full'?280:120)},true);
addEventListener('hashchange',()=>{if(level()==='still')return;if(!cutting){veil.classList.add('dn');veil.style.transition='none';void veil.offsetWidth;veil.style.transition=''}cutting=false;
 requestAnimationFrame(()=>requestAnimationFrame(up));onRoute()});

/* ---------- R2 human dealing cadence ---------- */
const CAD=[240,200,220,260,210];
const MO=window.MO={level,SFX,
 deal(k,N){if(!FULL())return k*160;let t=380;for(let j=2;j<=k;j++){t+=CAD[j%CAD.length]+(Math.random()-.5)*50;if(N===9&&(j-1)%3===0)t+=400}return t},
 jit(){return FULL()?(Math.random()-.5)*3:0}};

/* ---------- R1 shuffle sound + squaring the deck ---------- */
let lastRiffle=0,cntObs=null;
function watchShuffle(){cntObs?.disconnect();const c=$('#cnt');if(!c)return;SFX.warm('shuffle','slide1','slide2','tap','place');
 cntObs=new MutationObserver(()=>{const s=c.textContent,now=performance.now();
  if(/^洗牌 \d+%/.test(s)&&now-lastRiffle>520){lastRiffle=now;SFX.play(Math.random()<.5?'slide1':'slide2',{vol:.55})}
  if(s==='洗好了'&&!c._sq){c._sq=1;SFX.play('shuffle',{vol:.5});setTimeout(()=>{SFX.play('tap',{vol:.7});SFX.play('tap',{vol:.5,at:.34});buzz(8);
   if(FULL()){const st=c.closest('.ab-in')||document;st.classList.add('mo-knock');setTimeout(()=>st.classList.remove('mo-knock'),760)}},350)}});
 cntObs.observe(c,{childList:true,characterData:true,subtree:true})}

/* ---------- R3 flip highlight strength by distance from the lamp ---------- */
function litCards(){const W=ab.classList.contains('m')?390:1440;$$('.flipcard').forEach(el=>{const x=(el.offsetLeft+el.offsetWidth/2)/W-.52,y=(el.offsetTop+el.offsetHeight/2)/900+.15;
 el.style.setProperty('--lit',Math.max(.35,1-Math.hypot(x,y*.6)*.9).toFixed(2))})}
document.addEventListener('click',e=>{const b=e.target.closest('#flipb');if(!b||!FULL())return;const f=b.closest('.dlgp')?.querySelector('.flipcard');if(!f)return;
 f.classList.remove('mo-roll');void f.offsetWidth;f.classList.add('mo-roll')},true);

/* ---------- R5 ink bleeding into paper ---------- */
function inkReading(){const v=$('.ab-in');if(!v||!/^#\/reading/.test(location.hash))return;
 const blocks=$$('.paperT,.ink:not(.ink2)',v);if(!blocks.length||level()==='still')return;v.classList.add('mo-ink-wait');
 let n=0;const wrap=el=>{[...el.childNodes].forEach(nd=>{if(nd.nodeType===3&&nd.textContent.trim()){const parts=nd.textContent.split(/(?<=[。，；！？、,.])/);
   const fr=document.createDocumentFragment();parts.forEach(p=>{if(!p)return;const s=document.createElement('span');s.className='mo-s';s.textContent=p;s.style.animationDelay=(n++*(FULL()?260:40))+'ms';s.style.animationPlayState='paused';fr.append(s)});nd.replaceWith(fr)}
  else if(nd.nodeType===1&&!/^(BUTTON|svg)$/i.test(nd.tagName))wrap(nd)})};
 blocks.forEach(wrap);
 const go=()=>{v.classList.remove('mo-ink-wait');$$('.mo-s',v).forEach(s=>s.style.animationPlayState='running')};
 if(v.classList.contains('drawn'))go();else{const o=new MutationObserver(()=>{if(v.classList.contains('drawn')){o.disconnect();go()}});o.observe(v,{attributes:true,attributeFilter:['class']});setTimeout(()=>{o.disconnect();go()},9000)}}

/* ---------- R6 wax seal for 收藏 ---------- */
document.addEventListener('click',e=>{const b=e.target.closest('#dlg [data-a="1"]');if(!b)return;const h=$('#dlg h3');if(!$('#dlg .ovkp')&&!(h&&/收藏|收进/.test(h.textContent)))return;
 const k=$('#keep:not([disabled])')||$('#fav');if(!k||level()==='still')return;SFX.load('seal');
 setTimeout(()=>{const r=k.getBoundingClientRect();if(!r.width)return;const s=document.createElement('div');s.className='mo-seal';s.setAttribute('aria-hidden','true');
  s.style.left=(r.left+Math.min(r.width/2,26))+'px';s.style.top=(r.top+r.height/2)+'px';document.body.append(s);
  setTimeout(()=>{SFX.play('seal',{vol:.9});buzz(12)},level()==='full'?470:0);setTimeout(()=>s.remove(),3500)},120)},true);

/* =================== batch 2 =================== */
const isM=()=>ab.classList.contains('m');
const busy=()=>performance.now()<MO.busy||/^#\/draw/.test(location.hash);
/* A3 lamp sway after each cut */
function sway(){if(!FULL())return;ab.classList.remove('mo-sway');void ab.offsetWidth;ab.classList.add('mo-sway');clearTimeout(sway.t);sway.t=setTimeout(()=>ab.classList.remove('mo-sway'),4300)}
/* A4 a draft every 20–40s, only while idle, never during the ritual */
let draftT=0;function draft(){clearTimeout(draftT);draftT=setTimeout(()=>{draft();if(!FULL()||document.hidden||busy()||idleFor()<4000)return;MO.gust()},20000+Math.random()*20000)}
MO.gust=()=>{
 const c=$$('.ab-in .paperT,.ab-in .slip,.ab-in .tagp').filter(e=>e.offsetWidth&&!e.closest('.mo-pinned'));if(!c.length)return;const e=c[Math.random()*c.length|0];
 e.classList.remove('mo-lift');void e.offsetWidth;e.classList.add('mo-lift');setTimeout(()=>e.classList.remove('mo-lift'),1700)};
/* A5 felt nap: desktop + fine pointer only; brushed trail, 1/8 resolution, runs only while a trail exists */
const Nap={on:false,init(){if(coarse||!matchMedia('(pointer:fine)').matches)return;this.cv=document.createElement('canvas');this.cv.className='mo-nap';this.cv.setAttribute('aria-hidden','true');
  amb.before(this.cv);this.m=document.createElement('canvas');this.img=new Image();this.img.src='assets/mo/nap.webp';this.size();
  addEventListener('pointermove',e=>this.move(e),{passive:true});addEventListener('resize',()=>this.size())},
 size(){if(!this.cv)return;const W=1440,H=ab.offsetHeight||900;this.cv.width=this.m.width=W/8|0;this.cv.height=this.m.height=H/8|0;this.cv.style.height=H+'px'},
 move(e){if(!FULL()||isM()||busy()||e.pointerType!=='mouse')return;if(e.target.closest('a,button,.card,.body,.paperT,.slip,.tile,#sheet,#dlg,.nav'))return;
  const r=ab.getBoundingClientRect(),k=r.width/1440,x=(e.clientX-r.left)/k/8,y=(e.clientY-r.top)/k/8;const g=this.m.getContext('2d');
  if(this.lx!=null&&Math.hypot(x-this.lx,y-this.ly)<12){g.globalCompositeOperation='source-over';g.strokeStyle='rgba(255,255,255,.35)';g.lineCap='round';g.lineWidth=2.2;g.beginPath();g.moveTo(this.lx,this.ly);g.lineTo(x,y);g.stroke()}
  this.lx=x;this.ly=y;this.left=150;if(!this.on){this.on=true;requestAnimationFrame(()=>this.tick())}},
 tick(){if(document.hidden||--this.left<0){this.on=false;this.lx=null;return}if((this.left&1)===1){requestAnimationFrame(()=>this.tick());return}const g=this.m.getContext('2d');
  g.globalCompositeOperation='destination-out';g.fillStyle='rgba(0,0,0,.035)';g.fillRect(0,0,this.m.width,this.m.height);
  const c=this.cv.getContext('2d');c.globalCompositeOperation='copy';c.drawImage(this.m,0,0);c.globalCompositeOperation='source-in';
  if(this.img.complete){c.fillStyle=c.createPattern(this.img,'repeat');c.globalAlpha=.11;c.fillRect(0,0,this.cv.width,this.cv.height);c.globalAlpha=1}
  requestAnimationFrame(()=>this.tick())}};
/* A6 window light + rain shadows: results page, or late at night anywhere on the table */
const win=document.createElement('div');win.className='mo-win';win.setAttribute('aria-hidden','true');
function windowLight(){const h=new Date().getHours(),late=h>=22||h<5,show=level()!=='still'&&(/^#\/reading/.test(location.hash)||late)&&!/^#\/draw/.test(location.hash);
 if(!win.parentNode)amb.after(win);const m=isM();Object.assign(win.style,m?{left:'190px',top:'560px',width:'230px',height:'160px',rotate:'-8deg'}:{left:'1040px',top:'500px',width:'420px',height:'290px',rotate:'-9deg'});
 if(show&&!win.childElementCount&&FULL())for(let i=0;i<3;i++){const d=document.createElement('i');d.style.left=(12+Math.random()*76)+'%';d.style.animationDuration=(7+Math.random()*5)+'s';d.style.animationDelay=(-Math.random()*10)+'s';win.append(d)}
 if(show){win.style.display='';requestAnimationFrame(()=>requestAnimationFrame(()=>win.classList.add('on')))}else{win.classList.remove('on');win.style.display='none'}}
/* A7 the clock you only hear: soft tick, reading / landing, only with sound on, stops when idle or hidden */
let clockT=0;function clock(){clearInterval(clockT);const h=location.hash;if(!(h===''||h==='#/'||h.startsWith('#/reading')))return;SFX.warm('tick');
 clockT=setInterval(()=>{if(document.hidden||idleFor()>60000||!SFX.ok()||busy())return;SFX.play('tick',{vol:.16,rate:.9})},1000)}
/* T2 dolly + rack focus on the ritual path */
let lastKey='';function dolly(){const k=(location.hash.match(/^#\/(\w+)/)||[])[1]||'';const path=['topic','spread','draw','reading','ask'];const go=path.includes(k)&&k!==lastKey;lastKey=k;
 if(!go||level()!=='full')return;const pl=$('.plate',ab);if(pl&&pl.src){const f=document.createElement('canvas');f.className='mo-focus';f.setAttribute('aria-hidden','true');f.width=160;f.height=Math.round(160*(pl.naturalHeight||900)/(pl.naturalWidth||1440));try{f.getContext('2d').drawImage(pl,0,0,f.width,f.height)}catch{}pl.after(f);setTimeout(()=>f.remove(),1400)}
 ab.classList.remove('mo-dolly');void ab.offsetWidth;ab.classList.add('mo-dolly');setTimeout(()=>ab.classList.remove('mo-dolly'),1700)}
/* T4 a hand passes under the lamp as the reading begins (loading screen) */
new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes)if(n.id==='load'&&level()==='full'){const h=document.createElement('div');h.className='mo-hand';h.setAttribute('aria-hidden','true');document.body.append(h);setTimeout(()=>h.remove(),1400)}}).observe(document.body,{childList:true});
/* R4 chalk crumbs at stroke ends */
function crumbs(){const v=$('.ab-in');if(!v||level()==='still')return;const run=()=>$$('.chalkline',v).slice(0,12).forEach(p=>{if(p._cr||Math.random()<.3)return;p._cr=1;
  const d=parseFloat(p.style.transitionDelay)||0;setTimeout(()=>{try{const L=p.getTotalLength(),pt=p.getPointAtLength(L*.98),n=1+(Math.random()*2|0);
   for(let i=0;i<n;i++){const c=document.createElementNS('http://www.w3.org/2000/svg','circle');c.setAttribute('class','mo-crumb');c.setAttribute('cx',pt.x+(Math.random()-.5)*4);c.setAttribute('cy',pt.y+1);c.setAttribute('r',(.5+Math.random()*.6).toFixed(2));
    c.style.setProperty('--dy',(4+Math.random()*4).toFixed(1)+'px');c.style.setProperty('--dx',((Math.random()-.5)*2).toFixed(1)+'px');c.style.animationDelay=(i*90)+'ms';p.parentNode.append(c)}}catch{}},d+650)});
 if(v.classList.contains('drawn'))run();else{const o=new MutationObserver(()=>{if(v.classList.contains('drawn')){o.disconnect();run()}});o.observe(v,{attributes:true,attributeFilter:['class']});setTimeout(()=>o.disconnect(),10000)}}
/* R7 the question slip settles and is pinned under the brass weight */
function pin(){const q=$('.ab-in .q');if(!q||!FULL())return;const p=q.closest('.A')||q;p.classList.add('mo-pinned');q.classList.add('mo-pin')}
/* M1 finger position on a held card */
document.addEventListener('pointerdown',e=>{const b=e.target.closest('.body');if(!b)return;const r=b.getBoundingClientRect();b.style.setProperty('--mx',((e.clientX-r.left)/r.width*100).toFixed(1)+'%');b.style.setProperty('--my',((e.clientY-r.top)/r.height*100).toFixed(1)+'%')},true);
/* M2 + M3 brass reflection follows the cursor; things outside the lamp answer more faintly */
document.addEventListener('pointerover',e=>{const t=e.target.closest('a,button,.tile,.slip');if(!t||t._mo)return;t._mo=1;const r=t.getBoundingClientRect();
 const x=(r.left+r.width/2)/innerWidth-.52,y=(r.top+r.height/2)/innerHeight+.1;if(Math.hypot(x,y*.8)>.62)t.classList.add('mo-far')},{passive:true});
document.addEventListener('pointermove',e=>{const t=e.target.closest?.('.btn,.pill');if(!t)return;const r=t.getBoundingClientRect();t.style.setProperty('--rx',(((e.clientX-r.left)/r.width-.5)*40).toFixed(1))},{passive:true});

/* ---------- route hook ---------- */
function onRoute(){setLevel();MO.busy=performance.now()+(/^#\/reading/.test(location.hash)?8000:0);amb.classList.toggle('off',MO.busy>performance.now()||/^#\/draw/.test(location.hash));wrapTap();requestAnimationFrame(()=>{Amb.layout();Amb.wake();watchShuffle();litCards();inkReading();sway();draft();windowLight();clock();dolly();crumbs();pin()})}

/* battery: drop to reduced ambient on low battery */
navigator.getBattery?.().then(b=>{const f=()=>{MO.battLow=!b.charging&&b.level<.2};f();b.addEventListener('levelchange',f);b.addEventListener('chargingchange',f)}).catch(()=>{});

Amb.init();Nap.init();onRoute();
})();
