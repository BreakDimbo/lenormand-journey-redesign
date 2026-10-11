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
document.addEventListener('click',e=>{const b=e.target.closest('#dlg [data-a="1"]');if(!b)return;const h=$('#dlg h3');if(!h||!/收藏/.test(h.textContent))return;
 const k=$('#keep:not([disabled])')||$('#fav');if(!k||level()==='still')return;SFX.load('seal');
 setTimeout(()=>{const r=k.getBoundingClientRect();if(!r.width)return;const s=document.createElement('div');s.className='mo-seal';s.setAttribute('aria-hidden','true');
  s.style.left=(r.left+r.width/2)+'px';s.style.top=(r.top+r.height/2)+'px';document.body.append(s);
  setTimeout(()=>{SFX.play('seal',{vol:.9});buzz(12)},level()==='full'?470:0);setTimeout(()=>s.remove(),3500)},120)},true);

/* ---------- route hook ---------- */
function onRoute(){setLevel();MO.busy=performance.now()+(/^#\/reading/.test(location.hash)?8000:0);amb.classList.toggle('off',MO.busy>performance.now()||/^#\/draw/.test(location.hash));wrapTap();requestAnimationFrame(()=>{Amb.layout();Amb.wake();watchShuffle();litCards();inkReading()})}

/* battery: drop to reduced ambient on low battery */
navigator.getBattery?.().then(b=>{const f=()=>{MO.battLow=!b.charging&&b.level<.2};f();b.addEventListener('levelchange',f);b.addEventListener('chargingchange',f)}).catch(()=>{});

Amb.init();onRoute();
})();
