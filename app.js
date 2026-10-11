(()=>{
'use strict';
const C=window.CARDS,T=window.TOPICS,TPL=window.TEMPLATES;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const main=$('#main');
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const clean=s=>String(s||'').replace(/\s+/g,'').replace(/[，,。；;、]+$/,'').trim();
const zh=c=>c.localizedNames?.zh||c.aliases?.[0]||c.name;
const kw=c=>(c.nouns||[]).map(clean).filter(x=>x&&x.length<=3&&x!==zh(c)).slice(0,3).join('·');
const noun=c=>(c.nouns||[]).map(clean).find(x=>x&&x!==zh(c)&&!(c.aliases||[]).includes(x)&&x.length<=4)||clean(c.summary).slice(0,4);
const ICON={relationship:'<path d="M12 20 4.5 12.5a4.2 4.2 0 0 1 6-6L12 8l1.5-1.5a4.2 4.2 0 0 1 6 6z"/>',career:'<path d="M12 21V8M12 8l-4 4M12 8l4 4M5 21h14M8 4h8"/>',wealth:'<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3.5"/>','lost-item':'<circle cx="12" cy="7" r="3.2"/><path d="M12 10v11M12 16h4M12 19h3"/>',decision:'<path d="M12 21v-8M12 13 6 6M12 13l6-7M4 6h4M16 6h4"/>',overview:'<path d="M16 4a8 8 0 1 0 4 12 6.5 6.5 0 0 1-4-12z"/>'};
const SPREADS={three:{name:'三张线性牌',count:3,desc:'看清变化',pos:['起因','此刻','走向']},
 five:{name:'五张线性牌',count:5,desc:'看见关系',pos:['来处','近因','核心','近果','去向']},
 nine:{name:'九张肖像牌阵',count:9,desc:'展开全貌',pos:['过去·隐','过去','过去·显','此刻·隐','核心','此刻·显','未来·隐','未来','未来·显']}};
const DOMKEY={relationship:'relationship',career:'career',wealth:'wealth','lost-item':'lost-item',decision:'general',overview:'general'};
const LS={get:(k,d)=>{try{return JSON.parse(localStorage.getItem('sr.'+k))??d}catch{return d}},set:(k,v)=>localStorage.setItem('sr.'+k,JSON.stringify(v))};
const prefs=Object.assign({ambient:false,vol:.5,tts:true,voice:'',reduce:false},LS.get('prefs',{}));
const savePrefs=()=>{LS.set('prefs',prefs);document.documentElement.classList.toggle('rm',RM())};
const RM=()=>prefs.reduce||matchMedia('(prefers-reduced-motion: reduce)').matches;
document.documentElement.classList.toggle('rm',RM());
let S=Object.assign({topic:'relationship',q:'',facts:'',spread:null,picked:[]},JSON.parse(sessionStorage.getItem('sr.draft')||'{}'));
const save=()=>sessionStorage.setItem('sr.draft',JSON.stringify(S));
const toast=m=>{const t=$('.toast');t.textContent=m;t.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('on'),2000)};
const mobile=()=>innerWidth<=820;
const mbrand=sub=>`<div class="mbrand"><b>寂境</b><i>Stillrealm</i>${sub?`<div class="sub" style="margin-top:6px">${sub}</div>`:''}</div>`;

const cardHTML=(c,cls='')=>`<div class="card ${cls}" role="img" aria-label="${c.id} ${esc(zh(c))} ${esc(c.name)}"><div class="hd"><span>${c.id}</span>${esc(zh(c))}</div><img src="assets/cards/${String(c.id).padStart(2,'0')}.webp" alt="" loading="lazy" decoding="async" draggable="false"><div class="en">${esc(c.name.toUpperCase())}</div><div class="kw">${esc(kw(c))}</div></div>`;
const backHTML=()=>`<div class="card back" aria-hidden="true"></div>`;
const chalkText=(t,d0=0)=>[...t].map((ch,i)=>`<span class="ch" style="transition-delay:${d0+i*70+(Math.random()*30|0)}ms">${esc(ch)}</span>`).join('');
const shuffle=a=>{const r=new Uint32Array(a.length);crypto.getRandomValues(r);for(let i=a.length-1;i>0;i--){const j=r[i]%(i+1);[a[i],a[j]]=[a[j],a[i]]}return a};

/* ================= physics ================= */
const LAMP={x:.52,y:-.15};
class Body{
 constructor(el,stage){this.el=el;this.stage=stage;this.x=0;this.y=0;this.r=0;this.z=0;this.vx=0;this.vy=0;this.vr=0;this.vz=0;
  this.tx=null;this.ty=0;this.tr=0;this.tz=0;this.k=260;this.zeta=.55;this.flip=0;this.vf=0;this.tflip=0;this.sh=el.querySelector('.sh');this.in3=el.querySelector('.in3');this.shade=el.querySelector('.shade');this.mode='free'}
 spring(x,y,r=0,k=260,z=.55){this.tx=x;this.ty=y;this.tr=r;this.k=k;this.zeta=z;this.mode='spring'}
}
const World={bodies:[],run:false,last:0,forces:null,
 add(b){this.bodies.push(b);this.start()},clear(){this.bodies=[];this.forces=null},
 start(){if(!this.run){this.run=true;this.last=performance.now();requestAnimationFrame(t=>this.tick(t))}},
 tick(t){const dt=Math.min(1/30,(t-this.last)/1000);this.last=t;let moving=false;
  if(this.forces)this.forces(dt);
  for(const b of this.bodies){
   if(b.mode==='spring'){const k=b.k,c=2*Math.sqrt(k)*b.zeta;
    b.vx+=(-k*(b.x-b.tx)-c*b.vx)*dt;b.vy+=(-k*(b.y-b.ty)-c*b.vy)*dt;b.vr+=(-k*(b.r-b.tr)-c*b.vr)*dt;}
   else if(b.mode==='free'){const f=Math.exp(-6*dt);b.vx*=f;b.vy*=f;b.vr*=Math.exp(-8*dt)}
   if(b.mode!=='drag'){b.x+=b.vx*dt;b.y+=b.vy*dt;b.r+=b.vr*dt}
   // height spring
   const kz=400,cz=2*Math.sqrt(kz)*.8;const pz=b.z;b.vz+=(-kz*(b.z-b.tz)-cz*b.vz)*dt;b.z+=b.vz*dt;if(b.z<0){b.z=0;b.vz=0;if(pz>2)b.land=performance.now()}
   // flip spring
   const kf=120,cf=2*Math.sqrt(kf)*.75;b.vf+=(-kf*(b.flip-b.tflip)-cf*b.vf)*dt;b.flip+=b.vf*dt;
   const sp=Math.abs(b.vx)+Math.abs(b.vy)+Math.abs(b.vr)*3+Math.abs(b.vz)+Math.abs(b.vf)*40+Math.abs(b.z-b.tz)+(b.mode==='spring'?Math.abs(b.x-b.tx)+Math.abs(b.y-b.ty):0);
   if(sp>.05||b.mode==='drag')moving=true;else{b.vx=b.vy=b.vr=0;if(b.mode==='spring'){b.x=b.tx;b.y=b.ty;b.r=b.tr}}
   this.render(b,t)}
  if(moving||this.forces)requestAnimationFrame(t=>this.tick(t));else this.run=false},
 render(b,t){const W=b.stage.clientWidth||1,H=innerHeight;
  const fz=Math.sin(b.flip*Math.PI)*28;const z=b.z+fz;
  const sq=b.land&&t-b.land<90?1-.015*Math.sin((t-b.land)/90*Math.PI):1;
  const s=(1+z*.0022)*sq;
  b.el.style.transform=`translate3d(${b.x.toFixed(2)}px,${b.y.toFixed(2)}px,0) rotate(${b.r.toFixed(3)}deg) scale(${s.toFixed(4)})`;
  b.el.style.zIndex=Math.round(10+z*10+(b.zi||0));
  const dx=(b.x+b.el.offsetWidth/2)/W-LAMP.x,dy=(b.y+b.el.offsetHeight/2)/H-LAMP.y;
  if(b.sh){b.sh.style.transform=`translate3d(${(dx*z*1.6+1).toFixed(1)}px,${(dy*z*1.6+3+z*.25).toFixed(1)}px,0) scale(${(1+z*.006).toFixed(3)})`;b.sh.style.opacity=Math.max(.18,.62-z*.008).toFixed(2)}
  if(b.in3){const a=b.flip*180;const bend=Math.sin(b.flip*Math.PI);b.in3.style.transform=`rotateY(${a.toFixed(2)}deg) skewY(${(bend*3).toFixed(2)}deg)`;
   if(b.shade)b.shade.style.opacity=(bend*.55).toFixed(2)}}
};
function makeBody(stage,inner,flippable){const el=document.createElement('div');el.className='body';el.innerHTML=`<div class="sh"></div><div class="in3">${inner}<div class="shade"></div></div>`;stage.append(el);return new Body(el,stage)}
function bindDrag(b,{onDrop,onPick}={}){
 let id=null,ox=0,oy=0,hist=[];
 b.el.addEventListener('pointerdown',e=>{if(b.locked)return;id=e.pointerId;b.el.setPointerCapture(id);const r=b.stage.getBoundingClientRect();ox=e.clientX-r.left-b.x;oy=e.clientY-r.top-b.y;b.mode='drag';b.tz=RM()?0:24;b.zi=50;hist=[[e.clientX,e.clientY,performance.now()]];b.el.classList.add('dragging');onPick&&onPick(b);World.start()});
 b.el.addEventListener('pointermove',e=>{if(e.pointerId!==id)return;const r=b.stage.getBoundingClientRect();const nx=e.clientX-r.left-ox,ny=e.clientY-r.top-oy;
  const now=performance.now();hist.push([e.clientX,e.clientY,now]);while(hist.length>2&&now-hist[0][2]>80)hist.shift();
  const vx=(nx-b.x)/(1/60);b.r+=((Math.max(-6,Math.min(6,vx*.004)))-b.r)*.2;b.x=nx;b.y=ny});
 const end=e=>{if(e.pointerId!==id)return;id=null;b.el.classList.remove('dragging');const h=hist,n=h.length;let vx=0,vy=0;
  if(n>1){const dt=(h[n-1][2]-h[0][2])/1000||.016;vx=(h[n-1][0]-h[0][0])/dt;vy=(h[n-1][1]-h[0][1])/dt}
  b.vx=vx;b.vy=vy;b.tz=0;b.mode='free';b.zi=0;onDrop&&onDrop(b,vx,vy);World.start()};
 b.el.addEventListener('pointerup',end);b.el.addEventListener('pointercancel',end);
}

/* ================= sound ================= */
const Sound={ctx:null,on:false,nodes:[],out:null,
 start(){const A=window.AudioContext||window.webkitAudioContext;if(!A)return;this.ctx=this.ctx||new A();const c=this.ctx;c.resume();
  const out=c.createGain();out.gain.value=0;out.connect(c.destination);out.gain.linearRampToValueAtTime(.06*prefs.vol,c.currentTime+4);
  const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=800;lp.connect(out);
  [55,82.4,110,164.8,220].forEach((f,i)=>{const o=c.createOscillator();o.type=i%2?'sine':'triangle';o.frequency.value=f;o.detune.value=(i-2)*4;const g=c.createGain();g.gain.value=.18/(i+1);
   const l=c.createOscillator();l.frequency.value=.03+i*.017;const lg=c.createGain();lg.gain.value=.08/(i+1);l.connect(lg).connect(g.gain);o.connect(g).connect(lp);o.start();l.start();this.nodes.push(o,l)});
  this.out=out;this.on=true},
 stop(){if(!this.ctx||!this.on)return;const c=this.ctx,o=this.out,n=this.nodes;o.gain.cancelScheduledValues(c.currentTime);o.gain.setValueAtTime(o.gain.value,c.currentTime);o.gain.linearRampToValueAtTime(0,c.currentTime+1.2);setTimeout(()=>n.forEach(x=>{try{x.stop()}catch{}}),1300);this.nodes=[];this.on=false},
 vol(){if(this.on&&this.out)this.out.gain.setTargetAtTime(.06*prefs.vol,this.ctx.currentTime,.2)},
 tap(){if(!this.on||!this.ctx)return;const c=this.ctx,b=c.createBuffer(1,c.sampleRate*.06,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,3);
  const s=c.createBufferSource();s.buffer=b;const f=c.createBiquadFilter();f.type='bandpass';f.frequency.value=1800;const g=c.createGain();g.gain.value=.25*prefs.vol;s.connect(f).connect(g).connect(c.destination);s.start()}};
const voices=()=>(window.speechSynthesis?.getVoices()||[]).filter(v=>/zh/i.test(v.lang));
const Voice={speaking:false,speak(text,btn){const s=window.speechSynthesis;if(!s){toast('此浏览器不支持朗读');return}
 if(this.speaking){s.cancel();this.speaking=false;btn?.setAttribute('aria-pressed','false');return}
 const u=new SpeechSynthesisUtterance(text);u.lang='zh-CN';u.rate=.88;u.pitch=.95;const v=voices().find(v=>v.name===prefs.voice)||voices()[0];if(v)u.voice=v;
 u.onend=u.onerror=()=>{this.speaking=false;btn?.setAttribute('aria-pressed','false')};s.speak(u);this.speaking=true;btn?.setAttribute('aria-pressed','true')}};

/* ================= interpretation ================= */
function domText(c,topic){const k=DOMKEY[topic]||'general';const arr=(c.domains?.[k]?.length?c.domains[k]:c.domains?.general)||[];return clean(arr.join(''))}
function pairLine(a,b){const A=window.PH[a.id],B=window.PH[b.id];return `${A.s}，${B.p}`}
function interpret(r){const cards=r.ids.map(id=>C[id-1]),sp=SPREADS[r.spread],tl=T.find(t=>t.id===r.topic)||T[0];
 const pol=cards.reduce((s,c)=>s+(c.polarity==='positive'?1:c.polarity==='negative'?-1:0),0);
 const tone=pol>1?'整体的风是顺的，事情愿意向前。':pol<-1?'整体偏向阻滞，先看清代价，再决定是否推进。':'局面仍在摇摆，身边的一张牌就能改变它的方向。';
 const core=r.spread==='nine'?cards[4]:r.spread==='five'?cards[2]:cards[1];
 const summary=cards.slice(0,3).map((c,i)=>`${sp.pos[i]}，${zh(c)}：${clean(c.summary)}`).join('；')+'。'+tone;
 return {cards,sp,tl,tone,core,summary,advice:clean(core.advice?.[0]||'')||'先完成手上最小的一步。',caution:clean(cards.map(c=>c.cautions?.[0]).find(Boolean)||''),timing:clean(cards[cards.length-1].timing?.duration||'')}}

/* ================= views ================= */
const view=(h)=>{main.innerHTML=`<div class="view">${h}</div>`;return main.firstElementChild};
const qPaper=(q,label='此刻 · 你的问题')=>`<div class="paper qnote"><div class="weight" aria-hidden="true"></div><div class="tag">${label}</div><div class="q" style="margin-top:8px">${esc(q)}</div></div>`;
const aside=`<p class="aside-note">卡牌不是预言，<br>而是让你听见内在声音的另一种语言。<small>—— Stillrealm</small></p>`;

function vLanding(){
 const v=view(`${mbrand()}<div class="land">
  <h1 class="title">尚未说出的事</h1>${aside}
  <div class="paper"><div class="weight" aria-hidden="true"></div><label class="sr" for="q">写下你想问的事</label>
   <textarea id="q" maxlength="600" placeholder="写下你想问的事…">${esc(S.q)}</textarea><span class="count"><span id="cnt">${S.q.length}</span>/600</span></div>
  <div class="pen" aria-hidden="true"></div>
  <button class="brass" id="go" ${S.q.trim().length<4?'disabled':''}>把问题压在桌上 <span aria-hidden="true">→</span></button>
  <p class="sub chalk hint">写下一件事，一个时间范围；或者先 <a href="#/topic" style="border-bottom:1px dashed">借一句问法</a></p></div>`);
 const q=$('#q'),go=$('#go');q.addEventListener('input',()=>{S.q=q.value;$('#cnt').textContent=q.value.length;go.disabled=q.value.trim().length<4;save()});
 go.onclick=()=>{const p=$('.land .paper');if(!RM()){p.animate([{transform:'rotate(-1deg) translateY(0)'},{transform:'rotate(-.4deg) translateY(-10px)',offset:.4},{transform:'rotate(-1deg) translateY(2px)'}],{duration:420,easing:'cubic-bezier(.22,.61,.36,1)'});$('.weight',p).animate([{transform:'translateY(-40px)',opacity:.6},{transform:'translateY(3px)',offset:.7},{transform:'none'}],{duration:420,easing:'cubic-bezier(.5,0,.75,0)'})}
  Sound.tap();setTimeout(()=>go2('#/topic'),RM()?0:430)};
}
function vTopic(){
 const tpl=()=>TPL.filter(t=>t.domain===S.topic).slice(0,4).map(t=>`<button class="slip" data-t="${esc(t.template)}">${esc(t.template)}<small>${esc(t.hint)}</small></button>`).join('');
 const v=view(`${mbrand()}${qPaper(S.q||'（还没写下问题，可以从右边借一句）')}
 <div class="topicwrap"><div><p class="title" style="margin-bottom:16px">选择一个想探问的方向</p>
  <div class="tiles" role="radiogroup" aria-label="主题">${T.map(t=>`<button class="tile" role="radio" aria-checked="${t.id===S.topic}" data-id="${t.id}" title="${esc(t.whisper)}"><svg viewBox="0 0 24 24" aria-hidden="true">${ICON[t.id]||''}</svg><span>${esc(t.label)}</span></button>`).join('')}</div>
  <details style="margin-top:18px"><summary class="sub" style="cursor:pointer;text-align:left">＋ 补充已知事实（可选）</summary><textarea class="facts" id="facts" maxlength="400" placeholder="已经发生了什么？">${esc(S.facts)}</textarea></details></div>
  <div class="slips"><p class="head">借一句问法，点一下即可替换</p><div id="slips" style="display:flex;flex-direction:column;gap:12px">${tpl()}</div></div></div>
 <div class="actions"><button class="brass" id="go" ${S.q.trim().length<4?'disabled':''}>带着问题，摆牌 <span aria-hidden="true">→</span></button></div>
 <p class="sub" style="margin-top:12px">你可以改写纸条上的问题——<a href="#/" style="border-bottom:1px dashed">回到纸条</a></p>`);
 $('.tiles').onclick=e=>{const b=e.target.closest('.tile');if(!b)return;S.topic=b.dataset.id;save();$$('.tile').forEach(x=>x.setAttribute('aria-checked',x===b));$('#slips').innerHTML=tpl()};
 $('#slips').onclick=e=>{const b=e.target.closest('.slip');if(!b)return;S.q=b.dataset.t;save();$('.qnote .q').textContent=S.q;$('#go').disabled=false;
  !RM()&&$('.qnote').animate([{transform:'rotate(-1.4deg) translateY(-8px)',opacity:.6},{transform:'rotate(-1.4deg)',opacity:1}],{duration:380,easing:'ease-out'})};
 $('#facts').oninput=e=>{S.facts=e.target.value;save()};
 $('#go').onclick=()=>go2('#/spread');
}
function recommend(){const q=S.q;if(/还是|或者|哪一个|二选一|两条/.test(q)||S.topic==='decision')return'five';if(S.topic==='overview'||q.length>90)return'nine';return'three'}
function vSpread(){
 if(!S.q.trim())return go2('#/');const rec=recommend();S.spread=S.spread||rec;
 const lay=id=>{const n=SPREADS[id].count;return `<div class="lay" style="grid-template-columns:repeat(${id==='nine'?3:n},auto)">${'<i></i>'.repeat(n)}</div>`};
 view(`${mbrand()}${qPaper(S.q)}<p class="title" style="margin-top:26px">选择牌阵</p><p class="sub">牌阵决定这次看多远</p>
 <div class="spreads" role="radiogroup" aria-label="牌阵">${Object.entries(SPREADS).map(([id,s])=>`<button class="sp" role="radio" aria-checked="${S.spread===id}" data-id="${id}">${id===rec?'<span class="rec chalk">推荐</span>':''}${lay(id)}<b>${s.name}</b><small>${s.desc}</small></button>`).join('')}</div>
 <div class="actions" style="align-items:center"><div class="seg" role="group" aria-label="牌数">${Object.entries(SPREADS).map(([id,s])=>`<button data-id="${id}" aria-pressed="${S.spread===id}">${s.count}</button>`).join('')}</div>
 <button class="brass" id="go">就这样摆 <span aria-hidden="true">→</span></button></div>`);
 const set=id=>{S.spread=id;save();$$('.sp').forEach(x=>x.setAttribute('aria-checked',x.dataset.id===id));$$('.seg button').forEach(x=>x.setAttribute('aria-pressed',x.dataset.id===id))};
 main.addEventListener('click',onSp);function onSp(e){const b=e.target.closest('.sp,.seg button');if(b)set(b.dataset.id)}
 cleanup.push(()=>main.removeEventListener('click',onSp));
 $('#go').onclick=()=>{S.picked=[];save();go2('#/draw')};
}
/* ---- draw: shuffle + fan + drag to slots ---- */
function vDraw(){
 if(!S.spread)return go2('#/spread');const sp=SPREADS[S.spread];const N=sp.count;
 const v=view(`${mbrand()}<p class="title">洗牌与抽牌</p><p class="sub" id="instr">在牌堆上画圈洗牌；洗好后，从扇形牌中拖一张放进凹槽</p>
 <div class="stage" id="stage"><div class="slots" id="slots">${Array.from({length:N},(_,i)=>`<div class="slot" data-i="${i}"><span class="lab">${sp.pos[i]}</span></div>`).join('')}</div></div>
 <p class="counter chalk" id="cnt" aria-live="polite">画圈洗牌</p>
 <div class="actions"><button class="brass dark" id="auto">替我洗牌</button><button class="brass" id="go" disabled>翻开 <span aria-hidden="true">→</span></button></div>`);
 const stage=$('#stage'),slotsEl=$('#slots');World.clear();
 const W=()=>stage.clientWidth;const cw=()=>parseFloat(getComputedStyle(stage).getPropertyValue('--cw'))||120;
 // layout
 const nineMode=N>5;
 const layout=()=>{const w=W(),c=cw(),mob=mobile();const sc=nineMode?(mob?.42:.5):N>3?(mob?.5:.62):(mob?.68:.82);
  const sw=c*sc;slotsEl.style.cssText=`position:absolute;--cw:${sw}px;display:grid;grid-template-columns:repeat(${nineMode?3:N},auto);gap:${nineMode?sw*.42:sw*.3}px ${sw*.32}px;`;
  if(mob){slotsEl.style.left='50%';slotsEl.style.transform='translateX(-50%)';slotsEl.style.top=(c*3.35)+'px'}
  else{slotsEl.style.left=(w*.56)+'px';slotsEl.style.top=(nineMode?40:c*1.45)+'px'}
  stage.style.height=Math.max(mob?0:c*4.1,slotsEl.offsetTop+slotsEl.offsetHeight+30)+'px'};
 layout();
 const deck=shuffle(C.map(c=>c.id));const bodies=[];
 const c0=cw(),cx=mobile()?W()/2:W()*.24,cy=mobile()?c0*.95:c0*1.2;
 deck.forEach((id,i)=>{const b=makeBody(stage,backHTML(),false);b.id=id;b.el.style.setProperty('--cw',c0*(mobile()?.44:.62)+'px');
  const a=Math.random()*Math.PI*2,rr=Math.random()*c0*(mobile()?.6:.9);b.x=cx+Math.cos(a)*rr-c0*.35;b.y=cy+Math.sin(a)*rr*.55-c0*.55;b.r=Math.random()*60-30;b.zi=i*.01;
  b.el.setAttribute('aria-hidden','true');bodies.push(b);World.add(b)});
 const bw=()=>bodies[0].el.offsetWidth,bh=()=>bodies[0].el.offsetHeight;
 let phase='shuffle',swirl=0,lastAng=null,gx=0,gy=0,shufAmt=0;
 // circle gesture on stage
 const center=()=>({x:mobile()?W()/2:W()*.24,y:cy});
 const sForces=dt=>{if(phase!=='shuffle')return;const c=center();
  for(const b of bodies){const px=b.x+bw()/2-c.x,py=b.y+bh()/2-c.y;const d=Math.hypot(px,py)+1;
   if(Math.abs(swirl)>.01){const f=swirl*900/(1+d/200);b.vx+=-py/d*f*dt;b.vy+=px/d*f*dt*.6;b.vr+=swirl*40*dt*(Math.random()-.3)}
   // keep in pile: soft pull
   const R=c0*(mobile()?.85:1.15);if(d>R){b.vx-=px/d*(d-R)*8*dt;b.vy-=py/d*(d-R)*8*dt}}
  // collisions (cheap: random pairs)
  for(let k=0;k<60;k++){const a=bodies[Math.random()*36|0],b=bodies[Math.random()*36|0];if(a===b)continue;const dx=a.x-b.x,dy=a.y-b.y,d=Math.hypot(dx,dy)+.1,m=bw()*.45;if(d<m){const p=(m-d)*3;a.vx+=dx/d*p;a.vy+=dy/d*p;b.vx-=dx/d*p;b.vy-=dy/d*p}}
  swirl*=Math.exp(-2.5*dt);if(Math.abs(swirl)<.01)swirl=0};
 World.forces=sForces;
 let gid=null;
 const onDown=e=>{if(phase!=='shuffle')return;gid=e.pointerId;stage.setPointerCapture(gid);lastAng=null};
 const onMove=e=>{if(e.pointerId!==gid||phase!=='shuffle')return;const r=stage.getBoundingClientRect(),c=center();const a=Math.atan2(e.clientY-r.top-c.y,e.clientX-r.left-c.x);
  if(lastAng!==null){let d=a-lastAng;if(d>Math.PI)d-=2*Math.PI;if(d<-Math.PI)d+=2*Math.PI;swirl+=d*1.6;swirl=Math.max(-2.5,Math.min(2.5,swirl));shufAmt+=Math.abs(d);
   $('#cnt').textContent=shufAmt>=Math.PI*3?'洗好了':`画圈洗牌 · ${Math.min(100,Math.round(shufAmt/(Math.PI*3)*100))}%`;World.start();if(shufAmt>=Math.PI*3)setTimeout(toFan,500)}lastAng=a};
 const onUp=e=>{if(e.pointerId===gid)gid=null};
 stage.addEventListener('pointerdown',onDown);stage.addEventListener('pointermove',onMove);stage.addEventListener('pointerup',onUp);stage.addEventListener('pointercancel',onUp);
 $('#auto').onclick=()=>{if(phase!=='shuffle'){return}if(RM()){toFan();return}let n=0;const it=setInterval(()=>{swirl=Math.min(2.5,swirl+.5);World.start();if(++n>14){clearInterval(it);setTimeout(toFan,450)}},60)};
 const slots=()=>$$('.slot',slotsEl);
 const slotPos=i=>{const s=slots()[i],r=s.getBoundingClientRect(),sr=stage.getBoundingClientRect();return{x:r.left-sr.left+(r.width-bw())/2,y:r.top-sr.top+(r.height-bh())/2,r,s}};
 function toFan(){if(phase!=='shuffle')return;phase='fan';World.forces=null;$('#auto').textContent='替我抽';$('#instr').textContent='拖一张牌放进凹槽，或轻点一张';$('#cnt').textContent=`已抽 0 / ${N}`;
  const w=W(),n=36,fanW=mobile()?w*.98:w*.62,R=fanW*1.5,baseY=mobile()?c0*2.05:c0*3.15,fx=mobile()?w/2:w*.36;
  bodies.forEach((b,i)=>{const t=(i-(n-1)/2)/(n-1);const ang=t*2*Math.asin(fanW/2/R);
   setTimeout(()=>{b.spring(fx-bw()/2+Math.sin(ang)*R,baseY-bh()/2+R*(1-Math.cos(ang))*1.0+bh()*.2,ang*180/Math.PI,RM()?2000:180,.7);b.zi=i;World.start()},RM()?0:i*18)});
  bodies.forEach(b=>bindDrag(b,{onPick:()=>{Sound.tap()},onDrop:drop}));
  bodies.forEach(b=>b.el.addEventListener('click',()=>{if(phase==='fan'&&!b.placed&&!b.moved)place(b,S.picked.length)}));
 }
 function drop(b,vx,vy){if(b.placed!=null)return snap(b,b.placed);
  const px=b.x+vx*.12,py=b.y+vy*.12;let best=-1,bd=1e9;slots().forEach((s,i)=>{if(slots()[i].dataset.full)return;const p=slotPos(i);const d=Math.hypot(p.x-px,p.y-py);if(d<bd){bd=d;best=i}});
  if(best>-1&&bd<bw()*1.1)place(b,best);else{b.mode='free';setTimeout(()=>{if(b.placed==null){b.spring(b.homeX??b.x,b.homeY??b.y,b.homeR??0,160,.7);World.start()}},400)}}
 function place(b,i){if(i>=N||S.picked.length>=N)return;const s=slots()[i];if(s.dataset.full)i=slots().findIndex(x=>!x.dataset.full);if(i<0)return;
  slots()[i].dataset.full=1;b.placed=i;b.locked=true;S.picked[i]=b.id;save();snap(b,i);Sound.tap();
  const filled=slots().filter(x=>x.dataset.full).length;$('#cnt').textContent=`已抽 ${filled} / ${N}`;if(filled>=N){$('#go').disabled=false;$('#instr').textContent='都到位了，翻开它们'}}
 function snap(b,i){const p=slotPos(i);const sc=p.r.width/1.1/bw();b.el.style.setProperty('--cw',(parseFloat(b.el.style.getPropertyValue('--cw'))*sc)+'px');
  requestAnimationFrame(()=>{const q=slotPos(i);b.spring(q.x,q.y,0,RM()?3000:260,.55);b.tz=0;b.zi=200;World.start()})}
 // record home position for fan bodies on pick
 const ro=new ResizeObserver(()=>{layout()});ro.observe(stage);cleanup.push(()=>ro.disconnect());
 $('#go').onclick=()=>{const ids=S.picked.slice(0,N);if(ids.length<N||ids.some(x=>!x))return;const rec={id:Date.now().toString(36),at:Date.now(),topic:S.topic,q:S.q,facts:S.facts,spread:S.spread,ids};
  sessionStorage.setItem('sr.current',JSON.stringify(rec));go2('#/reading/'+rec.id)};
 $('#auto').addEventListener('click',()=>{if(phase!=='fan')return;const free=bodies.filter(b=>b.placed==null);shuffle(free);let k=0;for(let i=0;i<N;i++){if(slots()[i].dataset.full)continue;const b=free[k++];setTimeout(()=>place(b,i),RM()?0:k*260)}});
 cleanup.push(()=>{World.clear()});
}
/* ---- reading ---- */
function flipIn(container,cards,stepMs){const bs=[];$$('.flipcard',container).forEach((el,i)=>{const b=new Body(el,container);b.in3=$('.in3',el);b.shade=$('.shade',el);b.sh=null;b.el=el;
  b.render=()=>{};bs.push(b)});
 const run=t=>{let m=false;for(const b of bs){const kf=120,cf=2*Math.sqrt(kf)*.75,dt=1/60;b.vf+=(-kf*(b.flip-b.tflip)-cf*b.vf)*dt;b.flip+=b.vf*dt;if(Math.abs(b.flip-b.tflip)>.001||Math.abs(b.vf)>.001)m=true;
  const a=b.flip*180,bend=Math.sin(Math.min(1,Math.max(0,b.flip))*Math.PI);b.in3.style.transform=`translateZ(${(bend*40).toFixed(1)}px) rotateY(${a.toFixed(2)}deg) skewY(${(bend*3).toFixed(2)}deg)`;b.shade.style.opacity=(bend*.6).toFixed(2);
  b.el.style.filter=`drop-shadow(${(bend*10).toFixed(1)}px ${(8+bend*16).toFixed(1)}px ${(8+bend*14).toFixed(1)}px rgba(0,0,0,${(.6-bend*.25).toFixed(2)}))`}
  if(m)requestAnimationFrame(run)};
 bs.forEach((b,i)=>{if(RM()){b.flip=b.tflip=1;b.in3.style.transform='rotateY(180deg)';b.el.style.filter='drop-shadow(0 8px 8px rgba(0,0,0,.6))';return}setTimeout(()=>{b.tflip=1;Sound.tap();requestAnimationFrame(run)},400+i*stepMs)});
 return bs.length*stepMs+400}
const flipHTML=c=>`<div class="flipcard"><div class="in3">${backHTML()}${cardHTML(c,'face').replace('class="card face"','class="card face" style="position:absolute;inset:0;transform:rotateY(180deg);backface-visibility:hidden"')}<div class="shade"></div></div></div>`;
function vReading(id){
 let rec=LS.get('history',[]).find(r=>r.id===id);const saved=!!rec;if(!rec){try{const c=JSON.parse(sessionStorage.getItem('sr.current'));if(c?.id===id)rec=c}catch{}}
 if(!rec)return go2('#/history');const R=interpret(rec);const nine=rec.spread==='nine';
 const narration=[rec.q,R.summary,'建议：'+R.advice].join('。');
 let body='';
 if(!nine){const vert=mobile()&&rec.spread==='five'||mobile()&&false;
  body=`<div class="spread3 ${mobile()&&rec.spread==='five'?'v':''}" style="${rec.spread==='five'?'--cw:clamp(80px,8.6vw,124px)':''}">${R.cards.map((c,i)=>`${i?`<div class="gap chalk" data-pair="${i}"><span>${chalkText(pairLine(R.cards[i-1],c),i*900)}</span><svg viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true"><path class="chalkline" style="--len:110;transition-delay:${i*900-300}ms" d="M2 6 Q50 3 96 5 M88 1 L96 5 L88 9"/></svg></div>`:''}<div style="display:flex;flex-direction:column;align-items:center;gap:10px"><span class="title" style="font-size:14px">${R.sp.pos[i]}</span>${flipHTML(c)}</div>`).join('')}</div>`}
 else{const lines=[];const L=(a,b)=>lines.push([a,b]);[0,1,2,3,5,6,7,8].forEach(i=>L(4,i));[0,1,3,4,6,7].forEach(i=>L(i,i+1));[0,1,2,3,4,5].forEach(i=>L(i,i+3));
  body=`<div class="grid9wrap"><div><div class="grid9" id="g9"><svg class="lines" aria-hidden="true"></svg>${R.cards.map((c,i)=>`<button class="flipcard ${i===4?'center':''}" data-i="${i}" aria-label="${R.sp.pos[i]} · ${esc(zh(c))}">${flipHTML(c).replace(/^<div class="flipcard">|<\/div>$/g,'')}</button>`).join('')}</div>
  <p class="focusnote chalk" id="fn" aria-live="polite">轻点一张牌，看它和周围的牌说了什么</p></div>
  <div class="paper side9"><h4>过去 · 第一行</h4><p>${R.cards.slice(0,3).map(zh).join(' · ')}：${esc(clean(R.cards[1].summary))}</p><h4>此刻 · 中间一行</h4><p>${R.cards.slice(3,6).map(zh).join(' · ')}：${esc(clean(R.cards[4].summary))}</p><h4>未来 · 第三行</h4><p>${R.cards.slice(6,9).map(zh).join(' · ')}：${esc(clean(R.cards[7].summary))}</p></div></div>`;
  setTimeout(()=>{const g=$('#g9');if(!g)return;const svg=$('svg',g);const draw=()=>{const gr=g.getBoundingClientRect();const pts=$$('.flipcard',g).map(e=>{const r=e.getBoundingClientRect();return[r.left-gr.left+r.width/2,r.top-gr.top+r.height/2]});
    svg.innerHTML=lines.map(([a,b],k)=>{const[x1,y1]=pts[a],[x2,y2]=pts[b];const len=Math.hypot(x2-x1,y2-y1);const mx=(x1+x2)/2+(k%3-1)*3,my=(y1+y2)/2+(k%2?3:-3);
     return`<g class="lineg" data-a="${a}" data-b="${b}"><path class="chalkline" style="--len:${len|0};transition-delay:${1800+k*60}ms" d="M${x1} ${y1} Q${mx} ${my} ${x2} ${y2}"/></g>`}).join('')};
   draw();g.parentElement.classList.add('drawn');addEventListener('resize',draw);cleanup.push(()=>removeEventListener('resize',draw));
   g.onclick=e=>{const b=e.target.closest('.flipcard');if(!b)return;const i=+b.dataset.i;g.classList.add('focus');$$('.lineg',g).forEach(l=>l.classList.toggle('on',+l.dataset.a===i||+l.dataset.b===i));
    const nb=lines.filter(([a,c])=>a===i||c===i).map(([a,c])=>a===i?c:a);const c=R.cards[i];
    $('#fn').innerHTML=`<b style="font-weight:400">${R.sp.pos[i]} · ${esc(zh(c))}</b>：${esc(nb.slice(0,2).map(j=>pairLine(c,R.cards[j])).join('；'))}`}},50)}
 const v=view(`${mbrand()}${qPaper(rec.q)}${aside}${body}
 <div class="paper strip readpaper" id="rp"><p>${esc(R.summary)}</p><div class="more">${R.cards.map((c,i)=>`<h3>${R.sp.pos[i]} · ${esc(zh(c))} ${esc(c.name)}</h3><p>${esc(clean(c.summary))}。${esc(domText(c,rec.topic))}</p>`).join('')}<h3>可以做的一步</h3><p>${esc(R.advice)}</p>${R.caution?`<h3>留意</h3><p>${esc(R.caution)}</p>`:''}${R.timing?`<h3>时间感</h3><p>${esc(R.timing)}</p>`:''}${rec.facts?`<h3>你补充的事实</h3><p>${esc(rec.facts)}</p>`:''}</div>
 <button class="toggle-more" id="more">展开逐张解读</button></div>
 <div class="actions"><div class="bar"><button id="keep" ${saved?'disabled':''}>${saved?'已保存':'保存'}</button><button id="tts" aria-pressed="false">朗读</button><button id="again">再问</button></div></div>`);
 const total=flipIn(v,R.cards,nine?180:520);
 if(!nine)setTimeout(()=>$('.spread3')?.classList.add('drawn'),RM()?0:total-200);
 $('#more').onclick=e=>{const o=$('#rp').classList.toggle('open');e.target.textContent=o?'收起':'展开逐张解读'};
 $('#keep').onclick=e=>{if(saved)return;LS.set('history',[rec,...LS.get('history',[])].slice(0,100));e.target.textContent='已保存';e.target.disabled=true;toast('已收进「我的记录」')};
 $('#tts').onclick=e=>prefs.tts?Voice.speak(narration,e.currentTarget):toast('朗读已在设置中关闭');
 $('#again').onclick=()=>{S={topic:S.topic,q:'',facts:'',spread:null,picked:[]};save();go2('#/')};
}
/* ---- atlas ---- */
let lq='',lf='all';
function vAtlas(){
 view(`${mbrand('牌库图鉴')}<div class="paper qnote" style="padding:22px 46px"><div class="weight" aria-hidden="true"></div><div class="q" style="font-size:22px">牌库图鉴</div></div>
 <div class="atlashead"><label class="sr" for="s">搜索牌名或关键词</label><input class="search" id="s" type="search" placeholder="搜索牌名或关键词" value="${esc(lq)}">
 <div class="filters" role="group" aria-label="倾向">${[['all','全部'],['positive','吉'],['neutral','中'],['negative','凶']].map(([k,l])=>`<button data-f="${k}" aria-pressed="${lf===k}">${l}</button>`).join('')}</div></div><div class="atlas" id="grid"></div>`);
 const draw=()=>{const q=lq.trim().toLowerCase();const L=C.filter(c=>(lf==='all'||c.polarity===lf)&&(!q||[c.name,zh(c),...(c.aliases||[]),...(c.nouns||[]),...(c.tags||[]),String(c.id)].join(' ').toLowerCase().includes(q)));
  $('#grid').innerHTML=L.length?L.map(c=>`<a href="#/card/${c.id}">${mobile()?cardHTML(c).replace('class="card "','class="card " data-n="'+c.id+'"').replace(/<div class="kw">[^<]*<\/div>/,'<div class="kw">'+esc(zh(c))+'</div>'):cardHTML(c)}</a>`).join(''):`<p class="empty chalk" style="grid-column:1/-1">没有找到「${esc(lq)}」，换个名词试试</p>`};
 $('#s').oninput=e=>{lq=e.target.value;draw()};$('.filters').onclick=e=>{const b=e.target.closest('button');if(!b)return;lf=b.dataset.f;$$('.filters button').forEach(x=>x.setAttribute('aria-pressed',x===b));draw()};draw();
}
const DL={general:'总体',relationship:'感情',career:'事业',wealth:'财富',health:'健康',personality:'性格',appearance:'外形',spirituality:'心灵',environment:'环境','lost-item':'寻物'};
function vCard(id){const c=C[id-1];if(!c)return go2('#/atlas');const p=C[(id+34)%36],n=C[id%36];
 view(`${mbrand('牌库图鉴')}<div class="detail"><div class="big">${cardHTML(c)}</div>
 <article class="index"><h1>${esc(zh(c))} · ${esc(c.name)}<small>No.${String(c.id).padStart(2,'0')}</small></h1><p class="core">核心含义：${esc(clean(c.summary))}</p><p class="kws">关键词：${esc((c.nouns||[]).map(clean).slice(0,6).join('、'))}</p>
 <div class="scroll"><dl>${Object.entries(c.domains||{}).filter(([,v])=>v?.length).map(([k,v])=>`<div><dt>${DL[k]||k}</dt><dd>${esc(clean(v.join('')))}</dd></div>`).join('')}
 ${c.timing?.duration?`<div><dt>时间</dt><dd>${esc(clean(c.timing.duration))}</dd></div>`:''}${c.advice?.length?`<div><dt>建议</dt><dd>${esc(clean(c.advice.join('')))}</dd></div>`:''}${c.cautions?.length?`<div><dt>留意</dt><dd>${esc(clean(c.cautions.join('')))}</dd></div>`:''}${c.pokerCard?`<div><dt>扑克</dt><dd>${esc(clean(c.pokerCard))}</dd></div>`:''}</dl></div></article></div>
 <nav class="pager chalk" aria-label="翻页"><a href="#/card/${p.id}">← ${esc(zh(p))}</a><a href="#/atlas">图鉴</a><a href="#/card/${n.id}">${esc(zh(n))} →</a></nav>`);
 !RM()&&$('.big').animate([{transform:'translate(-30px,20px) rotate(-6deg)',opacity:0},{transform:'rotate(-1.5deg)',opacity:1}],{duration:600,easing:'cubic-bezier(.22,.61,.36,1)'});
}
function vHistory(){const h=LS.get('history',[]);const fmt=t=>{const d=new Date(t);return `${d.getMonth()+1}月${d.getDate()}日`};
 view(`${mbrand()}<div class="paper qnote" style="padding:22px 46px"><div class="weight" aria-hidden="true"></div><div class="q" style="font-size:22px">来路余痕</div><div class="tag">每一次提问，都是一段旅程的足迹</div></div>
 ${h.length?`<div class="hist" id="hist"><svg class="path" aria-hidden="true"></svg>${h.map(r=>`<div class="bundle">${r.ids.slice(0,3).map(i=>cardHTML(C[i-1])).join('')}<span class="twine" aria-hidden="true"></span><a class="tagp" href="#/reading/${r.id}"><time>${fmt(r.at)}</time>${esc(r.q.slice(0,30))}${r.q.length>30?'…':''}</a><button class="del chalk" data-del="${r.id}" aria-label="删除这条记录">删去</button></div>`).join('')}</div>
 <div class="actions"><button class="brass dark" id="clear">清空</button></div>`:`<p class="empty chalk">桌上还没有留下记录</p><div class="actions"><a class="brass" href="#/">问第一件事 →</a></div>`}`);
 const el=$('#hist');if(el){const path=()=>{const er=el.getBoundingClientRect();const p=$$('.bundle',el).map(b=>{const r=b.getBoundingClientRect();return[r.left-er.left+60,r.top-er.top+170]});$('.path',el).innerHTML=p.length>1?`<path d="M${p.map(x=>x.join(' ')).join(' L')}" fill="none" stroke="rgba(240,236,224,.5)" stroke-width="1.5" stroke-dasharray="2 8" stroke-linecap="round"/>`:''};path();
  el.onclick=e=>{const d=e.target.closest('[data-del]');if(d){LS.set('history',LS.get('history',[]).filter(r=>r.id!==d.dataset.del));vHistory();toast('已删去')}}}
 $('#clear')&&($('#clear').onclick=()=>{if(confirm('清空这台设备上的全部记录？')){LS.set('history',[]);vHistory()}})}
function vSettings(){
 const vs=voices();
 view(`${mbrand('声音与设置')}<div class="paper qnote" style="padding:22px 46px"><div class="weight" aria-hidden="true"></div><div class="q" style="font-size:22px">声音与设置</div><div class="tag">让桌边的声音陪你，或者保持安静</div></div>
 <div class="panel">
  <div class="cell"><h3>环境声</h3><div class="grille"></div><button class="sw" role="switch" id="amb" aria-checked="${prefs.ambient}" aria-label="环境声"></button><p>低沉的室内底噪，默认关闭</p></div>
  <div class="cell"><h3>音量</h3><div class="knob" id="knob" role="slider" tabindex="0" aria-label="音量" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(prefs.vol*100)}"></div><p id="volv">${Math.round(prefs.vol*100)}%</p></div>
  <div class="cell"><h3>朗读解读</h3><button class="sw" role="switch" id="tts" aria-checked="${prefs.tts}" aria-label="朗读解读"></button><select id="voice" aria-label="声音"><option value="">系统默认中文</option>${vs.map(v=>`<option ${v.name===prefs.voice?'selected':''}>${esc(v.name)}</option>`).join('')}</select><p>使用浏览器内置语音，免费、离线</p></div>
  <div class="cell"><h3>减少动效</h3><button class="sw" role="switch" id="rm" aria-checked="${prefs.reduce}" aria-label="减少动效"></button><p>跟随系统，或在此关闭物理动效</p></div>
 </div><p class="chalk hint" style="margin-top:26px">静下来，听见内心的声音</p>`);
 const knob=$('#knob');const setK=()=>{knob.style.transform=`rotate(${-135+prefs.vol*270}deg)`;$('#volv').textContent=Math.round(prefs.vol*100)+'%';knob.setAttribute('aria-valuenow',Math.round(prefs.vol*100))};setK();
 let kid=null;knob.onpointerdown=e=>{kid=e.pointerId;knob.setPointerCapture(kid)};knob.onpointermove=e=>{if(e.pointerId!==kid)return;const r=knob.getBoundingClientRect();let a=Math.atan2(e.clientY-r.top-r.height/2,e.clientX-r.left-r.width/2)*180/Math.PI+90;if(a>180)a-=360;prefs.vol=Math.max(0,Math.min(1,(a+135)/270));setK();Sound.vol()};
 knob.onpointerup=()=>{kid=null;savePrefs()};knob.onkeydown=e=>{if(/Right|Up/.test(e.key))prefs.vol=Math.min(1,prefs.vol+.05);else if(/Left|Down/.test(e.key))prefs.vol=Math.max(0,prefs.vol-.05);else return;e.preventDefault();setK();Sound.vol();savePrefs()};
 const sw=(id,key,fn)=>{$('#'+id).onclick=e=>{prefs[key]=!prefs[key];e.currentTarget.setAttribute('aria-checked',prefs[key]);savePrefs();fn&&fn()}};
 sw('amb','ambient',()=>prefs.ambient?Sound.start():Sound.stop());sw('tts','tts');sw('rm','reduce');
 $('#voice').onchange=e=>{prefs.voice=e.target.value;savePrefs();Voice.speak('静下来，听见内心的声音。')};
}
/* ================= router ================= */
let cleanup=[];
function go2(h){if(location.hash===h)route();else location.hash=h}
function setBg(){const a=location.hash.split('/')[1]||'';let k={'':'01-landing',topic:'02-topic',spread:'03-spread',draw:'04-shuffle',reading:'05-reading3',atlas:'07-atlas',card:'08-card',history:'09-history',settings:'10-sound'}[a]||'01-landing';
 if(a==='reading'&&document.querySelector('.grid9'))k='06-reading9';$('.tablebg').style.backgroundImage=`url(assets/bg/${k}-${mobile()?'mobile':'desktop'}.webp)`}
addEventListener('resize',()=>setBg());
function route(){document.body.dataset.r=(location.hash.split('/')[1]||'');cleanup.forEach(f=>f());cleanup=[];World.clear();window.speechSynthesis?.cancel();
 const h=location.hash.replace(/^#/,'')||'/';const[,a,b]=h.split('/');
 const nav={atlas:'atlas',card:'atlas',history:'history',settings:'settings'}[a]||'read';
 $$('.nav a').forEach(x=>x.dataset.nav===nav?x.setAttribute('aria-current','page'):x.removeAttribute('aria-current'));
 ({'':vLanding,topic:vTopic,spread:vSpread,draw:vDraw,reading:()=>vReading(b),atlas:vAtlas,card:()=>vCard(+b),history:vHistory,settings:vSettings}[a||'']||vLanding)();
 const T2={topic:'选择方向',spread:'选择牌阵',draw:'洗牌与抽牌',reading:'解读',atlas:'牌库图鉴',card:'牌义',history:'我的记录',settings:'声音设置'}[a];
 setBg();document.title=(T2?T2+' · ':'')+'寂境 · 雷诺曼';scrollTo(0,0);main.focus({preventScroll:true})}
addEventListener('hashchange',route);route();
if(prefs.ambient)addEventListener('pointerdown',()=>{if(prefs.ambient&&!Sound.on)Sound.start()},{once:true});
speechSynthesis?.addEventListener?.('voiceschanged',()=>{if(location.hash==='#/settings')vSettings()});
})();
