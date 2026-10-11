(()=>{
'use strict';
const C=window.CARDS,T=window.TOPICS,TPL=window.TEMPLATES;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const main=$('#main');let SC=1;
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const clean=s=>String(s||'').normalize('NFKC').replace(/\s+/g,'').replace(/[，,。；;、]+$/,'').trim();
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
 render(b,t){const W=b.stage.clientWidth||1,H=b.stage.clientHeight||900;
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
 b.el.addEventListener('pointerdown',e=>{if(b.locked)return;id=e.pointerId;b.el.setPointerCapture(id);const r=b.stage.getBoundingClientRect();ox=(e.clientX-r.left)/SC-b.x;oy=(e.clientY-r.top)/SC-b.y;b.mode='drag';b.tz=RM()?0:24;b.zi=50;hist=[[e.clientX,e.clientY,performance.now()]];b.el.classList.add('dragging');onPick&&onPick(b);World.start()});
 b.el.addEventListener('pointermove',e=>{if(e.pointerId!==id)return;const r=b.stage.getBoundingClientRect();const nx=(e.clientX-r.left)/SC-ox,ny=(e.clientY-r.top)/SC-oy;
  const now=performance.now();hist.push([e.clientX,e.clientY,now]);while(hist.length>2&&now-hist[0][2]>80)hist.shift();
  const vx=(nx-b.x)/(1/60);b.r+=((Math.max(-6,Math.min(6,vx*.004)))-b.r)*.2;b.x=nx;b.y=ny});
 const end=e=>{if(e.pointerId!==id)return;id=null;b.el.classList.remove('dragging');const h=hist,n=h.length;let vx=0,vy=0;
  if(n>1){const dt=(h[n-1][2]-h[0][2])/1000||.016;vx=(h[n-1][0]-h[0][0])/dt/SC;vy=(h[n-1][1]-h[0][1])/dt/SC}
  b.vx=vx;b.vy=vy;b.tz=0;b.mode='free';b.zi=0;onDrop&&onDrop(b,vx,vy);World.start()};
 b.el.addEventListener('pointerup',end);b.el.addEventListener('pointercancel',end);
}

/* ================= sound ================= */
const Sound={ctx:null,on:false,nodes:[],out:null,
 start(){const A=window.AudioContext||window.webkitAudioContext;if(!A)return;this.ctx=this.ctx||new A();const c=this.ctx;c.resume();
  const out=c.createGain();out.gain.value=0;out.connect(c.destination);out.gain.linearRampToValueAtTime(.06*prefs.vol,c.currentTime+4);
  const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=800;lp.connect(out);
  const fk={rain:1,fire:.84,still:1.12}[prefs.amb]||1;lp.frequency.value={rain:900,fire:520,still:700}[prefs.amb]||800;[55,82.4,110,164.8,220].map(f=>f*fk).forEach((f,i)=>{const o=c.createOscillator();o.type=i%2?'sine':'triangle';o.frequency.value=f;o.detune.value=(i-2)*4;const g=c.createGain();g.gain.value=.18/(i+1);
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

/* ================= artboard ================= */
const M=()=>innerWidth<=820;
const ab=$('#ab'),wrap=$('#wrap'),plate=$('.plate',ab),chrome=$('#chrome'),tabs=$('#tabs');
let ABH=900,MODE='';
const px=v=>v==null?'':(typeof v==='number'?v+'px':v);
const A=(x,y,html='',o={})=>{const{w,h,cls='',st='',tag='div',at=''}=o;return`<${tag} class="A ${cls}" style="left:${px(x)};top:${px(y)};${w!=null?`width:${px(w)};`:''}${h!=null?`height:${px(h)};`:''}${st}" ${at}>${html}</${tag}>`};
const T_=(x,y,txt,fs,o={})=>A(x,y,txt,{...o,cls:'t '+(o.cls||''),st:`font-size:${fs}px;${o.st||''}`});
function fit(){const mob=M();const W=mob?390:1440;SC=innerWidth/W;ab.style.width=W+'px';const h=Math.max(mob?844:900,ABH);ab.style.height=h+'px';ab.style.transform=`scale(${SC})`;wrap.style.height=h*SC+'px';
 tabs.style.transform=`scale(${SC})`;tabs.style.width='390px'}
addEventListener('resize',()=>{const m=M()?'m':'d';if(m!==MODE)route();else fit()});
const pad=n=>String(n).padStart(2,'0');
const enTag=c=>(c.tags||[]).slice(0,2).join(' · ');
function cardHTML(c,v='d',w=120,h=null,extra=''){const lab=`${c.id} ${esc(zh(c))} ${esc(c.name)}`;const img=`<img src="assets/cards/${pad(c.id)}.webp" alt="" loading="lazy" decoding="async" draggable="false">`;
 const st=`--w:${w}px;${h?`height:${h}px;`:''}`;
 if(v==='m')return`<div class="card m ${extra}" style="${st}" role="img" aria-label="${lab}"><span class="n n1">${c.id}</span><span class="n n2">${c.id}</span>${img}<div class="zh">${esc(zh(c))}</div><div class="enn">${esc(c.name)}</div><div class="kw">${esc(enTag(c))}</div></div>`;
 if(v==='sq')return`<div class="card d sq ${extra}" style="${st}" role="img" aria-label="${lab}"><div class="hd"><span>${c.id}</span>${esc(zh(c))}</div>${img}<div class="enn">${esc(c.name.toUpperCase())}</div></div>`;
 return`<div class="card d ${extra}" style="${st}" role="img" aria-label="${lab}"><div class="hd"><span>${c.id}</span>${esc(zh(c))}</div>${img}<div class="enn">${esc(c.name.toUpperCase())}</div><div class="kw">${esc(kw(c))}</div></div>`}
const backHTML2=(w,h)=>`<div class="card back" style="--w:${w}px;${h?`height:${h}px`:''}" aria-hidden="true"></div>`;
const flip2=(c,v,w,h)=>`<div class="in3">${backHTML2(w,h)}${cardHTML(c,v,w,h,'face')}<div class="shade"></div></div>`;
/* ---- chrome ---- */
const NAV=[['#/','read','home','占卜仪式'],['#/atlas','atlas','book','牌库图鉴'],['#/history','history','doc','我的记录'],['#/today','today','heart','心灵札记'],['#/settings','settings','gear','设置']];
const TABIC={home:'moon',book:'book',doc:'doc',heart:'heart',gear:'gear'};
function chromeD(o){const tr=o.tr===undefined?['让日常，','也成为一种仪式。','<span class="en" style="font-size:11.5px;letter-spacing:.04em">A More Attentive Life</span>']:o.tr;
 let h=`<a href="#/" class="A t" style="left:26px;top:20px;font-size:28px;letter-spacing:.12em;text-shadow:0 1px 8px #000">寂境<span class="en" style="font-size:22px;letter-spacing:.02em;margin-left:12px">Stillrealm</span></a>`+T_(26,66,'在静默中，看见生活的下一页。',12.5,{cls:'mu',st:'letter-spacing:.14em'});
 h+=`<nav class="nav" aria-label="主导航">${NAV.map(([href,k,ic,l],i)=>A(0,134+i*50.5,`<img src="assets/ic/${ic}.webp" alt=""><span>${l}</span>`,{tag:'a',w:150,h:40,at:`href="${href}" data-nav="${k}"`})).join('')}</nav>`;
 if(tr&&tr.length)h+=T_(1302,22,tr.join('<br>'),12,{st:'line-height:1.75;letter-spacing:.1em'});
 if(o.bl)h+=T_(25,o.blY||774,o.bl.join('<br>'),12.5,{st:'line-height:1.65;letter-spacing:.12em'});
 if(o.br!==false)h+=A(o.brX||1396,o.brY||793,'CARDS<br>PEOPLE<br>A QUIETER YOU',{cls:'t en',st:'transform:translateX(-100%);text-align:right;font-size:10.5px;line-height:1.75;letter-spacing:.26em'});
 if(o.quote){const[x,y,lines,sig]=o.quote;h+=T_(x,y,lines.join('<br>'),12.5,{st:'line-height:1.95;letter-spacing:.12em'})+(sig?A(1178,y+lines.length*24+12,`—— &nbsp;${sig}`,{cls:'t',st:'transform:translateX(-100%);font-size:12px;letter-spacing:.1em'}):'')}
 chrome.innerHTML=h;tabs.classList.remove('on')}
function chromeM(o){const y=o.by??103,fs=o.bfs||30;let h='';
 if(o.brand!==false)h+=`<a href="#/" class="A t c" style="left:195px;top:${y}px;font-size:${fs}px;letter-spacing:.32em;line-height:1;padding-left:.32em">寂境</a>`+T_(195,y+fs*1.1,'Stillrealm',fs*.56,{cls:'c en',st:'letter-spacing:.06em;line-height:1'});
 if(o.orn!==false&&o.brand!==false)h+=A(195,y+fs*1.1+fs*.56+12,`<svg width="150" height="10" viewBox="0 0 150 10" aria-hidden="true"><path d="M0 5H64M86 5H150" stroke="rgba(226,196,138,.55)" stroke-width=".8"/><path d="M75 1l4 4-4 4-4-4z" fill="none" stroke="rgba(226,196,138,.8)" stroke-width=".8"/></svg>`,{cls:'c',st:'line-height:0'});
 if(o.foot)h+=T_(195,792,'更清晰的自己',9.5,{cls:'c mu',st:'letter-spacing:.3em'})+A(195,810,`<svg width="300" height="10" aria-hidden="true"><path d="M0 5H70M230 5H300" stroke="rgba(226,196,138,.4)" stroke-width=".7"/><text x="150" y="8" text-anchor="middle" fill="rgba(232,224,204,.6)" font-size="7.5" letter-spacing="2" font-family="Cormorant Garamond">A QUIETER MIND · A BRIGHTER PATH</text></svg>`,{cls:'c',st:'line-height:0'});
 if(o.back)h+=`<button class="A" style="left:19px;top:24px;width:30px;height:30px;border-radius:50%;box-shadow:inset 0 0 0 1px rgba(226,196,138,.6);color:var(--brass-hi);font-size:16px;background:rgba(0,0,0,.35)" onclick="history.length>1?history.back():location.hash='#/'" aria-label="返回">‹</button>`;
 chrome.innerHTML=h;
 if(o.tabs){tabs.innerHTML=`<div class="bar">${NAV.map(([href,k,ic,l])=>`<a href="${href}" data-nav="${k}"><img src="assets/ic/${TABIC[ic]}.webp" alt=""><span>${l}</span></a>`).join('')}</div>`;tabs.classList.add('on')}else tabs.classList.remove('on')}
function stage(key,html,o={}){MODE=M()?'m':'d';ABH=o.h||(MODE==='m'?844:900);ab.className=MODE;plate.src=`assets/plate/${key}-${MODE==='m'?'mobile':'desktop'}.webp`;
 (MODE==='m'?chromeM:chromeD)(o.ch||{});main.innerHTML=`<div class="ab-in">${html}</div>`;fit();return main.firstElementChild}
const chalkSVG=(d,len,x,y,w,h,delay=0)=>A(x,y,`<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="overflow:visible"><path class="chalkline" style="--len:${len};transition-delay:${delay}ms" d="${d}"/></svg>`,{st:'line-height:0;pointer-events:none'});
const markDrawn=el=>requestAnimationFrame(()=>requestAnimationFrame(()=>el.classList.add('drawn')));
const qtext=(q,fb)=>esc(q||fb);

/* ================= views ================= */
function vLanding(){const m=M();const ok=S.q.trim().length>=4;
 const v=m?stage('01-landing',
  T_(195,193,'尚未说出的事',12.5,{cls:'c',st:'letter-spacing:.3em'})+
  `<label class="sr" for="q">写下你想问的事</label><textarea id="q" class="A qin" maxlength="600" placeholder="写下你想问的事…" style="left:84px;top:356px;width:246px;height:150px;font:400 25px/1.55 var(--brush)">${esc(S.q)}</textarea>`+
  A(320,505,`<span id="cnt">${S.q.length}</span>/600`,{cls:'en ink2',st:'transform:translateX(-100%);font-size:12px;font-style:italic'})+
  T_(195,548,chalkText('有些答案，一直在等你。'),18,{cls:'c chalk'})+chalkSVG('M2 14 Q90 2 200 6',220,95,568,210,18,900)+
  A(103,656,'把问题压在桌上 <span aria-hidden="true">→</span>',{tag:'button',cls:'btn hit',w:184,h:44,st:'font-size:15px',at:`id="go" ${ok?'':'disabled'}`})+
  `<a class="A t c mu" href="#/topic" style="left:195px;top:712px;font-size:11px;border-bottom:1px dashed;letter-spacing:.14em">或者先借一句问法</a>`,{ch:{by:103,tabs:true}})
 :stage('01-landing',
  T_(803,121,'尚未说出的事',21,{cls:'c',st:'letter-spacing:.32em'})+A(803,165,`<svg width="110" height="14" aria-hidden="true"><path d="M0 7H44M66 7H110" stroke="rgba(226,196,138,.5)" stroke-width=".8"/><path d="M50 10q5-9 11-6-4 6-11 6z" fill="rgba(226,196,138,.7)"/></svg>`,{cls:'c',st:'line-height:0'})+
  `<label class="sr" for="q">写下你想问的事</label><textarea id="q" class="A qin" maxlength="600" placeholder="写下你想问的事…" style="left:578px;top:292px;width:470px;height:270px;font:400 21px/1.8 var(--serif);letter-spacing:.14em">${esc(S.q)}</textarea>`+
  A(1060,566,`<span id="cnt">${S.q.length}</span>/600`,{cls:'en ink2',st:'transform:translateX(-100%);font-size:13px;font-style:italic'})+
  A(649,656,'把问题压在桌上 <span aria-hidden="true">→</span>',{tag:'button',cls:'btn hit',w:309,h:62,st:'font-size:19px',at:`id="go" ${ok?'':'disabled'}`})+
  `<a class="A t c mu" href="#/topic" style="left:803px;top:736px;font-size:12.5px;border-bottom:1px dashed;letter-spacing:.16em">或者先借一句问法</a>`,
  {ch:{bl:['36 张卡牌','无预设的未来','只有更清晰的你']}});
 markDrawn(v);
 const q=$('#q'),go=$('#go');q.addEventListener('input',()=>{S.q=q.value;$('#cnt').textContent=q.value.length;go.disabled=q.value.trim().length<4;save()});
 go.onclick=()=>{if(!RM())q.animate([{transform:'translateY(0)'},{transform:'translateY(-6px)',offset:.4},{transform:'none'}],{duration:380,easing:'cubic-bezier(.22,.61,.36,1)'});Sound.tap();setTimeout(()=>go2('#/topic'),RM()?0:400)};
}
function vTopic(){const m=M();
 const tpl=()=>TPL.filter(t=>t.domain===S.topic).slice(0,3);
 const TD=m?{tiles:[[40,265,150,75],[203,265,147,75],[40,348,150,74],[203,348,147,74],[40,430,150,73],[203,430,147,73]],lbY:52,lbF:12.5,slips:[[92,537,223,34],[100,574,213,32],[108,610,205,34]],sF:11}
  :{tiles:[[489,281,167,112],[684,281,167,112],[489,413,167,112],[684,413,167,112],[489,545,167,112],[684,545,167,112]],lbY:74,lbF:14,slips:[[905,298,305,96],[930,421,276,74],[910,505,252,80]],sF:15};
 const tiles=`<div role="radiogroup" aria-label="主题">${T.map((t,i)=>{const[x,y,w,h]=TD.tiles[i];return`<button class="tile A" role="radio" aria-checked="${t.id===S.topic}" data-id="${t.id}" aria-description="${esc(t.whisper)}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px">${m?'':`<img class="sic" src="assets/tile/ic${i}.webp" alt="" aria-hidden="true">`}<span class="lb" style="top:${TD.lbY}px;font-size:${TD.lbF}px">${esc(t.label)}</span></button>`}).join('')}</div>`;
 const slips=()=>tpl().map((t,i)=>{const[x,y,w,h]=TD.slips[i];return`<button class="slip" data-t="${esc(t.template)}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;font-size:${TD.sF}px;padding:${m?'0 8px':'0 34px 0 48px'};display:flex;align-items:center;justify-content:center"><span>${esc(t.template)}</span></button>`}).join('');
 const v=m?stage('02-topic',
  A(62,182,`<div class="q" id="qq" style="font-size:12.5px;line-height:1.5;text-align:center;letter-spacing:.04em">${qtext(S.q,'（还没写下问题，可以从下面借一句）')}</div>`,{w:270,h:46,st:'display:flex;align-items:center;justify-content:center;overflow:hidden'})+
  T_(195,241,'选择你关心的主题',12,{cls:'c',st:'letter-spacing:.24em'})+tiles+
  T_(195,514,'借一个问题',12.5,{cls:'c',st:'letter-spacing:.24em'})+`<div id="slips">${slips()}</div>`+
  T_(118,672,chalkText('让心里的疑问，慢慢清晰'),17,{cls:'chalk',st:'transform:rotate(-7deg);transform-origin:0 0'})+chalkSVG('M0 22 Q80 4 175 0',190,128,694,180,24,1200)+
  A(37,732,'开始占卜 <span aria-hidden="true">→</span>',{tag:'button',cls:'btn hit',w:313,h:44,st:'font-size:16px',at:`id="go"`}),{ch:{by:95,foot:true}})
 :stage('02-topic',
  T_(528,52,'此刻 · 你的问题',11,{cls:'ink2',st:'text-shadow:none;transform:rotate(-4deg);color:#6b5a44'})+
  A(505,82,`<div class="q" id="qq" style="text-align:center">${qtext(S.q,'（还没写下问题，可以从右边借一句）')}</div>`,{w:320,h:90,st:'display:flex;align-items:center;justify-content:center;transform:rotate(-4deg);overflow:hidden'})+
  T_(668,224,'选择一个想探问的方向',18,{cls:'c',st:'letter-spacing:.2em'})+tiles+
  T_(1034,244,'借一句问法，开始倾听',17,{cls:'c',st:'letter-spacing:.16em'})+`<div id="slips">${slips()}</div>`+
  T_(1036,603,chalkText('轻点纸条，借用这个问题'),17,{cls:'chalk'})+chalkSVG('M30 30 Q8 24 4 2 M0 9 L4 1 L10 7',80,975,578,40,34,1000)+
  A(907,100,'好的问题，<br>会带你走向更真实的自己。',{cls:'t',st:'font-size:12.5px;line-height:1.95;letter-spacing:.12em'})+A(1178,156,'—— &nbsp;寂境 &nbsp;Stillrealm',{cls:'t',st:'transform:translateX(-100%);font-size:12px'})+
  `<details class="A" style="left:905px;top:648px;width:300px"><summary class="t mu" style="font-size:12.5px;cursor:pointer;letter-spacing:.12em">＋ 补充已知事实（可选）</summary><textarea id="facts" maxlength="400" placeholder="已经发生了什么？" style="margin-top:8px;width:100%;height:64px;padding:8px 10px;font-size:13px;background:rgba(0,0,0,.4);border-radius:4px;box-shadow:inset 0 0 0 1px rgba(176,141,85,.4);color:var(--ivory)">${esc(S.facts)}</textarea></details>`+
  A(560,712,'带着问题，继续 <span aria-hidden="true">→</span>',{tag:'button',cls:'btn hit',w:301,h:53,st:'font-size:19px',at:`id="go"`})+
  T_(708,786,'让一个清晰的问题，成为仪式的开始。',12.5,{cls:'c mu'}),{ch:{bl:['36 张卡牌','无预设的未来','只有更清晰的你']}});
 markDrawn(v);
 v.addEventListener('click',e=>{const b=e.target.closest('.tile');if(b){S.topic=b.dataset.id;save();$$('.tile').forEach(x=>x.setAttribute('aria-checked',x===b));$('#slips').innerHTML=slips();return}
  const s=e.target.closest('.slip');if(s){S.q=s.dataset.t;save();$('#qq').textContent=S.q;!RM()&&$('#qq').animate([{opacity:.2,transform:'translateY(-6px)'},{opacity:1,transform:'none'}],{duration:380,easing:'ease-out'})}});
 $('#facts')&&($('#facts').oninput=e=>{S.facts=e.target.value;save()});
 $('#go').onclick=()=>{if(S.q.trim().length<4){toast('先写下或借一句问题');return}go2('#/spread')};
}
function recommend(){const q=S.q;if(/还是|或者|哪一个|二选一|两条/.test(q)||S.topic==='decision')return'five';if(S.topic==='overview'||q.length>90)return'nine';return'three'}
function vSpread(){if(!S.q.trim())return go2('#/');const rec=recommend();S.spread=S.spread||rec;const m=M();
 const TR=m?{three:[72,200,246,108,195,290],five:[70,322,250,95,195,398],nine:[98,425,194,186,195,593]}:{three:[414,329,232,181,530,532],five:[669,329,301,181,820,532],nine:[993,270,234,261,1110,552]};
 const ids=['three','five','nine'];const fs=m?11:14;
 const trays=`<div role="radiogroup" aria-label="牌阵">${ids.map(id=>{const[x,y,w,h,lx,ly]=TR[id],s=SPREADS[id];return`<button class="tray A" role="radio" aria-checked="${S.spread===id}" data-id="${id}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px" aria-label="${s.name}"></button>`+T_(lx,ly,`${s.name} · ${s.desc}`,fs,{cls:'c',st:'pointer-events:none;letter-spacing:.16em'})}).join('')}</div>`;
 const recPos=m?{three:[322,236],five:[324,352],nine:[300,460]}:{three:[455,272],five:[700,272],nine:[1010,215]};const[rx,ry]=recPos[rec];
 const seg=(cx,cy,dx)=>`<div class="seg" role="group" aria-label="牌数">${ids.map((id,i)=>`<button data-id="${id}" aria-pressed="${S.spread===id}" style="left:${cx+(i-1)*dx}px;top:${cy}px">${SPREADS[id].count}</button>`).join('')}</div>`;
 const v=m?stage('03-spread',T_(195,175,'选择牌阵',15,{cls:'c',st:'letter-spacing:.3em'})+trays+T_(rx,ry,chalkText('推荐'),17,{cls:'chalk',st:'transform:rotate(-18deg)'})+chalkSVG('M0 16 Q20 22 34 4',50,rx-4,ry+20,40,24,700)+seg(196,647,55)+
   A(55,713,'就这样摆 <span aria-hidden="true">→</span>',{tag:'button',cls:'btn hit',w:278,h:47,st:'font-size:17px',at:'id="go"'}),{ch:{by:95,foot:true}})
 :stage('03-spread',T_(528,52,'此刻 · 你的问题',11,{cls:'ink2',st:'text-shadow:none;transform:rotate(-4deg);color:#6b5a44'})+
   T_(660,98,'选择牌阵',23,{cls:'c ink',st:'text-shadow:none;transform:translateX(-50%) rotate(-4deg);color:#2b2116;letter-spacing:.24em'})+T_(668,140,'不同的视角，通往不同的答案。',13,{cls:'c',st:'text-shadow:none;transform:translateX(-50%) rotate(-4deg);color:#4a3b28'})+
   A(942,96,'有时，<br>不是答案改变了我们，<br>而是提问的方式。',{cls:'t',st:'font-size:12.5px;line-height:1.95'})+A(1178,175,'—— &nbsp;寂境 &nbsp;Stillrealm',{cls:'t',st:'transform:translateX(-100%);font-size:12px'})+
   trays+T_(rx,ry,chalkText('推荐'),22,{cls:'chalk',st:'transform:rotate(-8deg)'})+chalkSVG('M70 4 Q20 6 2 40 M0 30 L2 42 L12 36',110,rx-48,ry+22,80,46,700)+seg(772,634,84)+
   A(621,683,'就这样摆 <span aria-hidden="true">→</span>',{tag:'button',cls:'btn hit',w:296,h:60,st:'font-size:20px',at:'id="go"'}),{ch:{bl:['36 张卡牌','无预设的未来','只有更清晰的你']}});
 markDrawn(v);
 const set=id=>{S.spread=id;save();$$('.tray').forEach(x=>x.setAttribute('aria-checked',x.dataset.id===id));$$('.seg button').forEach(x=>x.setAttribute('aria-pressed',x.dataset.id===id))};
 v.addEventListener('click',e=>{const b=e.target.closest('.tray,.seg button');if(b)set(b.dataset.id)});
 $('#go').onclick=()=>{S.picked=[];save();go2('#/draw')};
}
/* ---- draw ---- */
function slotRects(N,m){if(m){if(N===3)return[[68,545],[158,545],[250,545]].map(([x,y])=>[x,y,72,92]);
  if(N===5)return[0,1,2,3,4].map(i=>[33+i*66,550,58,80]);return[0,1,2,3,4,5,6,7,8].map(i=>[127+(i%3)*48,540+(i/3|0)*62,42,56])}
 if(N===3)return[[819,355],[965,355],[1108,355]].map(([x,y])=>[x,y,126,183]);
 if(N===5)return[0,1,2,3,4].map(i=>[800+i*92,370,84,122]);return[0,1,2,3,4,5,6,7,8].map(i=>[912+(i%3)*80,240+(i/3|0)*106,70,98])}
function vDraw(){if(!S.spread)return go2('#/spread');const sp=SPREADS[S.spread],N=sp.count,m=M();const SR=slotRects(N,m);
 const cw=m?56:100,ch=cw*1.5;
 const slotsH=SR.map(([x,y,w,h],i)=>`<div class="slot" data-i="${i}" aria-label="${sp.pos[i]}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px"></div>`).join('');
 const top=Math.min(...SR.map(r=>r[1])),bot=Math.max(...SR.map(r=>r[1]+r[3])),cx=m?195:1026;
 const v=m?stage('04-draw',`<div id="stage" class="A" style="inset:0">${slotsH}</div>`+
   T_(318,180,chalkText('画圈洗牌'),15,{cls:'chalk',st:'transform:rotate(14deg)'})+chalkSVG('M70 10 Q-10 60 20 170 M14 160 L20 172 L28 162',260,40,158,80,180,200)+chalkSVG('M10 0 Q80 40 40 165 M34 155 L40 167 L48 157',240,300,190,80,180,500)+
   T_(195,503,'<span id="cnt">画圈洗牌</span>',16,{cls:'c chalk'})+chalkSVG('M0 6 Q60 -2 120 8',130,135,530,120,12,300)+
   A(88,737,'替我洗牌',{tag:'button',cls:'btn hit',w:212,h:43,st:'font-size:16px;z-index:900',at:'id="act"'}),{ch:{by:72,bfs:28,foot:true}})
 :stage('04-draw',`<div id="stage" class="A" style="inset:0">${slotsH}</div>`+
   T_(880,82,'洗牌与抽牌',22,{cls:'c',st:'text-shadow:none;color:#2b2116;transform:translateX(-50%) rotate(-3deg);letter-spacing:.2em'})+T_(886,122,'静下心，让指尖带你找到答案。',13,{cls:'c',st:'text-shadow:none;color:#4a3b28;transform:translateX(-50%) rotate(-3deg)'})+
   A(979,212,'有些答案，<br>并不在远方，而在你愿意停下来的此刻。',{cls:'t',st:'font-size:12.5px;line-height:1.95'})+A(1207,262,'—— &nbsp;寂境 &nbsp;Stillrealm',{cls:'t',st:'transform:translateX(-100%);font-size:12px'})+
   chalkSVG('M110 6 Q20 10 8 90 Q10 160 70 182 M2 76 L8 92 L18 80',330,690,240,120,190,200)+T_(706,300,chalkText('画圈洗牌'),18,{cls:'chalk',st:'transform:rotate(-22deg)'})+
   T_(cx,top-36,`<span style="opacity:.6">———</span>&nbsp; <span id="cnt">画圈洗牌</span> &nbsp;<span style="opacity:.6">———</span>`,15,{cls:'c',st:'letter-spacing:.18em'})+
   A(cx,bot+16,'替我洗牌',{tag:'button',cls:'btn t',st:'transform:translateX(-50%);font-size:15px;letter-spacing:.24em;border-bottom:1px solid rgba(233,207,152,.6);padding:4px 6px;z-index:900',at:'id="act"'}),{ch:{bl:['36 张卡牌','无预设的未来','只有更清晰的你']}});
 markDrawn(v);
 const st=$('#stage');World.clear();
 const deck=shuffle(C.map(c=>c.id)),bodies=[];
 const P=m?{x:190,y:268,rx:100,ry:85}:{x:448,y:266,rx:172,ry:172};
 deck.forEach((id,i)=>{const b=makeBody(st,backHTML2(cw),false);b.id=id;b.el.style.width=cw+'px';b.el.style.height=ch+'px';
  const a=i/36*Math.PI*2*(m?2.3:1)+Math.random()*.2,rr=m?.35+Math.random()*.65:1;
  b.x=P.x+Math.cos(a)*P.rx*rr-cw/2;b.y=P.y+Math.sin(a)*P.ry*rr-ch/2;b.r=m?Math.random()*70-35:a*180/Math.PI+90;b.zi=i*.01;b.el.setAttribute('aria-hidden','true');bodies.push(b);World.add(b)});
 let phase='shuffle',swirl=0,lastAng=null,amt=0;const act=$('#act'),cnt=$('#cnt');
 const setCnt=t=>{cnt.textContent=t};
 World.forces=dt=>{if(phase!=='shuffle')return;for(const b of bodies){const px=b.x+cw/2-P.x,py=b.y+ch/2-P.y,d=Math.hypot(px,py)+1;
   if(Math.abs(swirl)>.01){const f=swirl*700/(1+d/200);b.vx+=-py/d*f*dt;b.vy+=px/d*f*dt;b.vr+=swirl*40*dt*(Math.random()-.3)}
   const R=m?P.rx*1.05:P.rx*1.1;if(d>R){b.vx-=px/d*(d-R)*8*dt;b.vy-=py/d*(d-R)*8*dt}if(!m&&d<P.rx*.7){b.vx+=px/d*(P.rx*.7-d)*6*dt;b.vy+=py/d*(P.rx*.7-d)*6*dt}}
  for(let k=0;k<60;k++){const a=bodies[Math.random()*36|0],b=bodies[Math.random()*36|0];if(a===b)continue;const dx=a.x-b.x,dy=a.y-b.y,d=Math.hypot(dx,dy)+.1,mm=cw*.45;if(d<mm){const p=(mm-d)*3;a.vx+=dx/d*p;a.vy+=dy/d*p;b.vx-=dx/d*p;b.vy-=dy/d*p}}
  swirl*=Math.exp(-2.5*dt);if(Math.abs(swirl)<.01)swirl=0};
 let gid=null;const loc=e=>{const r=st.getBoundingClientRect();return[(e.clientX-r.left)/SC,(e.clientY-r.top)/SC]};
 st.addEventListener('pointerdown',e=>{if(phase!=='shuffle')return;gid=e.pointerId;st.setPointerCapture(gid);lastAng=null});
 st.addEventListener('pointermove',e=>{if(e.pointerId!==gid||phase!=='shuffle')return;const[x,y]=loc(e);const a=Math.atan2(y-P.y,x-P.x);
  if(lastAng!==null){let d=a-lastAng;if(d>Math.PI)d-=2*Math.PI;if(d<-Math.PI)d+=2*Math.PI;swirl=Math.max(-2.5,Math.min(2.5,swirl+d*1.6));amt+=Math.abs(d);setCnt(amt>=Math.PI*3?'洗好了':`洗牌 ${Math.min(100,Math.round(amt/(Math.PI*3)*100))}%`);World.start();if(amt>=Math.PI*3)setTimeout(toFan,500)}lastAng=a});
 const up=e=>{if(e.pointerId===gid)gid=null};st.addEventListener('pointerup',up);st.addEventListener('pointercancel',up);
 const slots=()=>$$('.slot',st);
 const slotXY=i=>{const[x,y,w,h]=SR[i];return{x,y,w,h}};
 function toFan(){if(phase!=='shuffle')return;phase='fan';World.forces=null;act.textContent='替我抽牌';setCnt(`已抽 0 / ${N}`);
  const ring=bodies.slice(0,m?18:16),fan=bodies.slice(m?18:16);
  ring.forEach((b,i)=>{if(m){const a=Math.random()*Math.PI*2,rr=Math.sqrt(Math.random());b.spring(P.x+Math.cos(a)*84*rr-cw/2,P.y+Math.sin(a)*82*rr-ch/2,Math.random()*80-40,140,.8);return}const a=i/ring.length*Math.PI*2;b.spring(P.x+Math.cos(a)*172-cw/2,P.y+Math.sin(a)*172-ch/2,a*180/Math.PI+90,140,.8);b.zi=i});
  const n=fan.length;fan.forEach((b,i)=>{const t=i/(n-1);let x,y,r;
   if(m){const dx=-160+t*320,R=524;x=195+dx;y=961-Math.sqrt(R*R-dx*dx);r=Math.asin(dx/R)*180/Math.PI}
   else{x=404+671*t;y=628+107*t-18*Math.sin(Math.PI*t);r=-5+15*t}
   b.home=[x-cw/2,y-ch/2,r];setTimeout(()=>{b.spring(x-cw/2,y-ch/2,r,RM()?2000:180,.7);b.zi=i;World.start()},RM()?0:i*18)});
  ring.forEach(b=>b.home=[b.tx,b.ty,b.tr]);
  bodies.forEach(b=>{bindDrag(b,{onPick:()=>Sound.tap(),onDrop:drop});b.el.addEventListener('click',()=>{if(phase==='fan'&&b.placed==null)place(b,S.picked.filter(Boolean).length)})})}
 function drop(b,vx,vy){if(b.placed!=null)return snap(b,b.placed);const px=b.x+cw/2+vx*.12,py=b.y+ch/2+vy*.12;let best=-1,bd=1e9;
  SR.forEach((r,i)=>{if(slots()[i].dataset.full)return;const d=Math.hypot(r[0]+r[2]/2-px,r[1]+r[3]/2-py);if(d<bd){bd=d;best=i}});
  if(best>-1&&bd<Math.max(SR[0][2],cw)*1.2)place(b,best);else setTimeout(()=>{if(b.placed==null&&b.home){b.spring(...b.home,160,.7);World.start()}},350)}
 function place(b,i){if(i>=N)return;if(slots()[i].dataset.full)i=slots().findIndex(x=>!x.dataset.full);if(i<0)return;slots()[i].dataset.full=1;b.placed=i;b.locked=true;S.picked[i]=b.id;save();snap(b,i);Sound.tap();
  const f=slots().filter(x=>x.dataset.full).length;setCnt(`已抽 ${f} / ${N}`);if(f>=N){phase='done';act.textContent='翻开 →'}}
 function snap(b,i){const s=slotXY(i);const sc=Math.min((s.w*.88)/cw,(s.h*.88)/ch);b.el.style.transition='width .3s,height .3s';b.el.style.width=cw*sc+'px';b.el.style.height=ch*sc+'px';$('.card',b.el).style.setProperty('--w',cw*sc+'px');
  b.spring(s.x+(s.w-cw*sc)/2,s.y+(s.h-ch*sc)/2,0,RM()?3000:260,.55);b.tz=0;b.zi=300;World.start()}
 act.onclick=()=>{if(phase==='shuffle'){if(RM())return toFan();let n=0;const it=setInterval(()=>{swirl=Math.min(2.5,swirl+.5);World.start();if(++n>14){clearInterval(it);setTimeout(toFan,450)}},60);return}
  if(phase==='fan'){const free=shuffle(bodies.filter(b=>b.placed==null&&!bodies.slice(0,m?18:16).includes(b)));let k=0;for(let i=0;i<N;i++){if(slots()[i].dataset.full)continue;const b=free[k++];setTimeout(()=>place(b,i),RM()?0:k*240)}return}
  const ids=S.picked.slice(0,N);if(ids.length<N||ids.some(x=>!x))return;const rec={id:Date.now().toString(36),at:Date.now(),topic:S.topic,q:S.q,facts:S.facts,spread:S.spread,ids};
  sessionStorage.setItem('sr.current',JSON.stringify(rec));go2('#/reading/'+rec.id)};
 cleanup.push(()=>World.clear());
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

const split2=t=>{const i=t.indexOf('，');return i>0?[t.slice(0,i),t.slice(i+1)]:[t.slice(0,t.length/2|0),t.slice(t.length/2|0)]};
const fc=(c,v,x,y,w,h,i,extra='')=>`<div class="flipcard" data-i="${i}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;${extra}">${flip2(c,v,w,h)}</div>`;
const well=(x,y,w,h,p=10)=>A(x-p,y-p,'',{cls:'well',w:w+2*p,h:h+2*p});
function openSheet(R,rec){const sc=$('#sheet .sc');sc.innerHTML=`<p style="font-size:13px;color:#6b5a44;letter-spacing:.12em">此刻 · 你的问题</p><p style="font-size:18px;margin:4px 0 10px">${esc(rec.q)}</p><p>${esc(R.summary)}</p>${R.cards.map((c,i)=>`<h3>${R.sp.pos[i]} · ${esc(zh(c))} ${esc(c.name)}</h3><p>${esc(clean(c.summary))}。${esc(domText(c,rec.topic))}</p>`).join('')}<h3>可以做的一步</h3><p>${esc(R.advice)}</p>${R.caution?`<h3>留意</h3><p>${esc(R.caution)}</p>`:''}${R.timing?`<h3>时间感</h3><p>${esc(R.timing)}</p>`:''}${rec.facts?`<h3>你补充的事实</h3><p>${esc(rec.facts)}</p>`:''}`;
 const sh=$('#sheet');sh.hidden=false;$('.x',sh).focus();const close=()=>{sh.hidden=true};$('.x',sh).onclick=close;sh.onclick=e=>{if(e.target===sh)close()};sh.onkeydown=e=>{if(e.key==='Escape')close()}}
const bar3=(cx,y,dx,fs,saved,two)=>`<div class="bar3">${[['keep','save',saved?'已保存':'保存'],['tts','play','朗读'],['again','again','再问']].filter(x=>!two||x[0]!=='tts').map(([id,ic,l],i)=>`<button id="${id}" style="left:${cx+(two?(i-.5)*2:(i-1))*dx}px;top:${y}px;font-size:${fs}px" ${id==='keep'&&saved?'disabled':''} ${id==='tts'?'aria-pressed="false"':''}><img src="assets/ic/${ic}.webp" alt=""><span>${l}</span></button>`).join('')}</div>`;
function vReading(id){
 let rec=LS.get('history',[]).find(r=>r.id===id);const saved=!!rec;if(!rec){try{const c=JSON.parse(sessionStorage.getItem('sr.current'));if(c?.id===id)rec=c}catch{}}
 if(!rec)return go2('#/history');const R=interpret(rec),m=M(),cs=R.cards;const narration=[rec.q,R.summary,'建议：'+R.advice].join('。');let h='',key='05-reading3';
 const sum=`<p style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(R.summary)}</p>`;
 if(rec.spread==='nine'){key='06-reading9';
  if(m){const X=[51,154,258],Y=[219,361,502];
   h=T_(195,157,'九宫解读',12,{cls:'c',st:'letter-spacing:.3em'})+A(88,175,`<span style="flex:1;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(rec.q)}</span>`,{cls:'t',w:214,h:30,st:'display:flex;align-items:center;padding:0 26px 0 14px;font-size:12px;border-radius:16px;box-shadow:inset 0 0 0 1px rgba(226,196,138,.45);background:rgba(0,0,0,.3);letter-spacing:.06em'})+
    [['过去','Past'],['此刻','Present'],['未来','Future']].map(([a,b],r)=>A(10,Y[r]+22,`<b style="font-weight:500;font-size:12px;letter-spacing:.1em">${a}</b><i class="en" style="font-size:10px;font-style:italic">${b}</i>`,{cls:'ink',w:36,h:88,st:'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;background:#d9c7a1 url(assets/paper.webp) center/cover;background-blend-mode:multiply;box-shadow:0 4px 8px rgba(0,0,0,.6)'})).join('')+
    [['缘起',354],['连结',496],['方向',638]].map(([t,y])=>T_(195,y-8,t,12,{cls:'c',st:'letter-spacing:.3em'})+A(195,y,`<svg width="230" height="4"><path d="M0 2H85M145 2H230" stroke="rgba(226,196,138,.45)" stroke-width=".8"/></svg>`,{cls:'c',st:'line-height:0'})).join('')+
    cs.map((c,i)=>fc(c,'m',X[i%3],Y[i/3|0],90,128,i)).join('')+
    T_(190,650,chalkText(`在连结中，看见${noun(R.core)}的路`,1600),18,{cls:'c chalk'})+chalkSVG('M0 8 Q110 -2 220 6',240,85,680,220,12,2200)+
    `<p class="A t" style="left:195px;top:704px;transform:translateX(-50%);font-size:12px;display:flex;gap:18px"><button class="more" style="position:static" id="more">展开九宫解读</button><button id="tts" aria-pressed="false" style="border-bottom:1px dashed"><span>朗读</span></button></p>`+bar3(195,762,72,13.5,saved,true)}
  else{const X=[433,647,860],Y=[179,393,611],w=140,hh=192;const ctr=i=>[X[i%3]+w/2,Y[i/3|0]+hh/2];
   const L=[[0,1],[1,2],[3,4],[4,5],[6,7],[7,8],[4,0],[4,2],[4,6],[4,8]];
   const lab=(a,b)=>{const A1=clean((cs[a].actions||[])[0]||'').slice(0,2),B1=noun(cs[b]).slice(0,2);return`${A1}<br>${B1}`};
   h=T_(528,56,'此刻 · 你的问题',11,{cls:'ink2',st:'text-shadow:none;transform:rotate(-3deg);color:#6b5a44'})+A(500,82,`<div class="q" style="text-align:center;font-size:20px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(rec.q)}</div>`,{w:320,st:'transform:rotate(-3deg)'})+
    A(910,96,'答案不在远方，<br>而在你愿意倾听的此刻。',{cls:'t',st:'font-size:12.5px;line-height:1.95'})+A(1167,150,'—— &nbsp;寂境 &nbsp;Stillrealm',{cls:'t',st:'transform:translateX(-100%);font-size:12px'})+
    `<svg class="A lines" style="left:0;top:0;width:1440px;height:900px;pointer-events:none">${L.map(([a,b],k)=>{const[x1,y1]=ctr(a),[x2,y2]=ctr(b);const dx=x2-x1,dy=y2-y1,d=Math.hypot(dx,dy),ux=dx/d,uy=dy/d;
     const s=a===4?(Math.abs(dx)>0&&Math.abs(dy)>0?110:0):76;const sx=x1+ux*(dy===0?w/2+8:s),sy=y1+uy*(dy===0?0:s),ex=x2-ux*(dy===0?w/2+8:s),ey=y2-uy*(dy===0?0:s);
     return`<path class="chalkline" style="--len:200;transition-delay:${1800+k*80}ms" d="M${sx} ${sy} L${ex} ${ey} M${ex-ux*7-uy*4} ${ey-uy*7+ux*4} L${ex} ${ey} L${ex-ux*7+uy*4} ${ey-uy*7-ux*4}"/>`}).join('')}</svg>`+
    L.map(([a,b])=>{const[x1,y1]=ctr(a),[x2,y2]=ctr(b);const mx=(x1+x2)/2,my=(y1+y2)/2;return T_(mx+(y1===y2?0:(x2>x1?-34:34)),my-(y1===y2?32:22),lab(a,b),12,{cls:'c',st:'line-height:1.7;text-align:center;letter-spacing:.2em'})}).join('')+
    well(X[1],Y[1],w,hh,9)+cs.map((c,i)=>fc(c,'d',X[i%3],Y[i/3|0],w,hh,i)).join('')+
    A(1062,320,`<p style="font-size:13px;letter-spacing:.14em;border-bottom:1px solid rgba(70,50,25,.3);padding-bottom:8px;color:#3a2c1e">三行 · 九宫的指引</p>${[['过去',0],['此刻',3],['未来',6]].map(([t,s])=>`<h4 style="font-size:17px;font-weight:500;margin:16px 0 4px;letter-spacing:.2em">${t}</h4><p style="font-size:12px;line-height:1.7;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${cs.slice(s,s+3).map(zh).join(' · ')}：${esc(clean(cs[s+1].summary))}</p>`).join('')}
     <p style="margin-top:12px;display:flex;gap:14px;font-size:12.5px;letter-spacing:.12em" class="lk"><button id="more" style="border-bottom:1px dashed">展开</button><button id="keep" ${saved?'disabled':''}><span>${saved?'已保存':'保存'}</span></button><button id="tts" aria-pressed="false"><span>朗读</span></button><button id="again">再问</button></p>`,{cls:'ink',w:228,st:'transform:rotate(2.5deg);transform-origin:0 0'})}}
 else if(rec.spread==='five'){
  if(m){const Y=[188,284,380,476,572];h=T_(195,123,'五牌解读',16,{cls:'c',st:'letter-spacing:.3em'})+cs.map((c,i)=>fc(c,'m',70,Y[i],58,88,i)+T_(146,Y[i]+8,R.sp.pos[i],15,{st:'letter-spacing:.2em'})+A(146,Y[i]+34,esc(clean(c.summary))+'。',{cls:'t',w:200,h:48,st:'white-space:normal;font-size:11.5px;line-height:1.6;letter-spacing:.06em;overflow:hidden;color:var(--muted)'})).join('')+
    A(103,150,`<span style="flex:1;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(rec.q)}</span>`,{cls:'t',w:185,h:28,st:'display:flex;align-items:center;padding:0 22px 0 10px;font-size:11.5px;letter-spacing:.04em'})+A(40,676,sum,{cls:'ink',w:310,h:44,st:'font-size:11.5px;line-height:1.85;text-align:center;letter-spacing:.04em'})+`<button class="A" style="left:34px;top:672px;width:322px;height:68px" id="more" aria-label="展开逐张解读"></button>`+bar3(195,762,100,13.5,saved)}
  else{const X=[0,1,2,3,4].map(i=>418+i*170),y=318,w=118,hh=180;
   h=T_(528,56,'此刻 · 你的问题',11,{cls:'ink2',st:'text-shadow:none;transform:rotate(-3deg);color:#6b5a44'})+A(505,92,`<div class="q" style="text-align:center">${esc(rec.q)}</div>`,{w:330,h:70,st:'transform:rotate(-3deg);overflow:hidden'})+
    cs.map((c,i)=>T_(X[i]+w/2,y-46,R.sp.pos[i],15,{cls:'c',st:'letter-spacing:.24em'})+well(X[i],y,w,hh,9)+fc(c,'d',X[i],y,w,hh,i)).join('')+
    T_(799,526,chalkText(pairLine(cs[1],cs[3]),1600),20,{cls:'chalk c'})+
    A(445,580,sum,{cls:'ink',w:700,h:60,st:'font-size:15px;line-height:1.9;text-align:center;letter-spacing:.08em'})+`<button class="more A" style="left:1116px;top:660px;color:#3a2c1e" id="more">展开逐张解读</button>`+bar3(799,736,188,15,saved)}}
 else{
  if(m){const Y=[189,351,510];
   h=T_(195,123,'三牌解读',17,{cls:'c',st:'letter-spacing:.3em'})+A(103,150,`<span style="flex:1;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(rec.q)}</span>`,{cls:'t',w:185,h:28,st:'display:flex;align-items:center;padding:0 22px 0 10px;font-size:11.5px;border-radius:14px;box-shadow:inset 0 0 0 1px rgba(226,196,138,.45);background:rgba(0,0,0,.3);letter-spacing:.04em'})+
    cs.map((c,i)=>fc(c,'m',88,Y[i],88,143,i)+T_(195,Y[i]+20,R.sp.pos[i],18,{st:'letter-spacing:.3em'})+A(192,Y[i]+50,esc(clean(c.summary))+'。'+esc(domText(c,rec.topic)),{cls:'t',w:160,h:64,st:'white-space:normal;font-size:11.5px;line-height:1.45;letter-spacing:.04em;overflow:hidden;color:rgba(236,228,210,.82)'})).join('')+
    cs.slice(1).map((c,i)=>{const t=pairLine(cs[i],c);const y=Y[i]+150;return`<div class="A chalk" style="left:186px;top:${y}px;font-size:${Math.min(17,190/Math.max(8,t.length))}px;transform:rotate(-6deg);white-space:nowrap">${chalkText(t,1400+i*900)}</div>`+chalkSVG(`M0 14 Q4 -6 22 -8`,40,180,y+8,30,20,1300+i*900)}).join('')+
    A(40,676,sum,{cls:'ink',w:310,h:44,st:'font-size:11.5px;line-height:1.85;text-align:center;letter-spacing:.04em'})+`<button class="A" style="left:34px;top:672px;width:322px;height:68px" id="more" aria-label="展开逐张解读"></button>`+bar3(195,762,100,13.5,saved)}
  else{const X=[439,739,1056],y=296,w=159,hh=246;
   h=T_(528,56,'此刻 · 你的问题',11,{cls:'ink2',st:'text-shadow:none;transform:rotate(-3deg);color:#6b5a44'})+A(500,90,`<div class="q" style="text-align:center">${esc(rec.q)}</div>`,{w:340,h:70,st:'transform:rotate(-3deg);display:flex;align-items:center;justify-content:center;overflow:hidden'})+
    A(910,96,'卡牌不是预言，<br>而是让你听见内在声音的另一种语言。',{cls:'t',st:'font-size:12.5px;line-height:1.95'})+A(1167,150,'—— &nbsp;Stillrealm',{cls:'t',st:'transform:translateX(-100%);font-size:12px'})+
    cs.map((c,i)=>T_(X[i]+w/2,y-58,R.sp.pos[i],16,{cls:'c',st:'letter-spacing:.24em'})+well(X[i],y,w,hh,11)+fc(c,'d',X[i],y,w,hh,i)).join('')+
    cs.slice(1).map((c,i)=>{const[a,b]=split2(pairLine(cs[i],c));const cx=(X[i]+w+X[i+1])/2;return T_(cx,y+66,chalkText(a,1400+i*900)+'<br>'+chalkText(b,1400+i*900+a.length*70),Math.min(21,128/Math.max(a.length,b.length)),{cls:'c chalk',st:'line-height:1.55;text-align:center'})+chalkSVG('M0 6 Q40 3 84 5 M76 1 L84 5 L76 9',100,cx-42,y+136,90,12,1300+i*900)}).join('')+
    A(470,606,sum,{cls:'ink',w:650,h:58,st:'font-size:15px;line-height:1.95;text-align:center;letter-spacing:.08em'})+`<button class="more A" style="left:1120px;top:664px;color:#3a2c1e;transform:translateX(-100%)" id="more">展开逐张解读</button>`+bar3(799,736,188,15,saved)}}
 const v=stage(key,h,{ch:m?{by:rec.spread==='nine'?88:60,bfs:28,foot:true,brand:true}:{bl:rec.spread==='nine'?null:['在每一张牌里','无预设的未来','只有更清晰的你']}});
 const total=flipIn(v,cs,rec.spread==='nine'?180:520);setTimeout(()=>v.classList.add('drawn'),RM()?0:Math.max(0,total-1400));
 $('#more').onclick=()=>openSheet(R,rec);
 $('#keep').onclick=e=>{if(saved)return;LS.set('history',[rec,...LS.get('history',[]).filter(r=>r.id!==rec.id)].slice(0,100));e.currentTarget.querySelector('span').textContent='已保存';e.currentTarget.disabled=true;toast('已收进「我的记录」')};
 $('#tts').onclick=e=>prefs.tts?Voice.speak(narration,e.currentTarget):toast('朗读已在设置中关闭');
 $('#again').onclick=()=>{S={topic:S.topic,q:'',facts:'',spread:null,picked:[]};save();go2('#/')};
}
/* ---- atlas ---- */
let lq='',lf='all';
function vAtlas(){const m=M();
 const head=m?T_(195,90,'牌库图鉴',22,{cls:'c',st:'letter-spacing:.3em'})+T_(195,119,'36 张卡片，述说生活的每一种可能',10.5,{cls:'c mu',st:'letter-spacing:.14em'})+
   `<label class="sr" for="s">搜索牌名或关键词</label><input class="search" id="s" type="search" placeholder="搜索牌名或关键词" value="${esc(lq)}" style="left:80px;top:142px;width:230px;height:29px;font-size:12.5px">`+
   `<div class="fil" role="group" aria-label="倾向">${[['all','全部',131],['positive','吉',181],['neutral','中',223],['negative','凶',265]].map(([k,l,x])=>`<button data-f="${k}" aria-pressed="${lf===k}" style="left:${x}px;top:182px;font-size:12px">${l}</button>`).join('')}</div>`+
   T_(296,170,chalkText('每一张牌')+'<br>'+chalkText('都是一种指引',300),12,{cls:'chalk',st:'transform:rotate(-12deg);line-height:1.3'})
  :A(445,30,'牌库图鉴',{cls:'ink',st:'font-size:27px;letter-spacing:.2em;transform:rotate(-4deg);font-weight:500'})+
   `<label class="sr" for="s">搜索牌名或关键词</label><input class="search" id="s" type="search" placeholder="搜索牌名或关键词" value="${esc(lq)}" style="left:660px;top:66px;width:270px;height:36px;font-size:13px">`+
   `<div class="fil" role="group" aria-label="倾向">${[['all','全部',992],['positive','吉',1056],['neutral','中',1106],['negative','凶',1160]].map(([k,l,x])=>`<button data-f="${k}" aria-pressed="${lf===k}" style="left:${x}px;top:73px;font-size:13px">${l}</button>`).join('')}</div>`+
   A(1263,40,'36 张卡牌，<br>汇聚成更完整的你。',{cls:'t',st:'font-size:12px;line-height:1.75'})+A(1400,86,'—— &nbsp;寂境 &nbsp;Stillrealm',{cls:'t',st:'transform:translateX(-100%);font-size:11.5px'})+
   A(25,412,'每一张牌，<br>都是生活的低语。',{cls:'t',st:'font-size:12.5px;line-height:1.95'})+A(25,470,'—— &nbsp;寂境 &nbsp;Stillrealm',{cls:'t',st:'font-size:11.5px'});
 const v=stage('07-atlas',head+'<div id="grid"></div>',{ch:m?{by:30,bfs:22,orn:false,tabs:true}:{tr:null,br:false,bl:null},h:m?1760:900});
 if(!m)chrome.insertAdjacentHTML('beforeend',A(25,808,'CARDS<br>PEOPLE<br>A QUIETER YOU',{cls:'t en',st:'font-size:10.5px;line-height:1.75;letter-spacing:.26em'}));
 markDrawn(v);
 const draw=()=>{const q=lq.trim().toLowerCase();const L=C.filter(c=>(lf==='all'||c.polarity===lf)&&(!q||[c.name,zh(c),...(c.aliases||[]),...(c.nouns||[]).map(clean),...(c.tags||[]),String(c.id)].join(' ').toLowerCase().includes(q)));
  $('#grid').innerHTML=L.length?L.map((c,i)=>m?`<a class="A" href="#/card/${c.id}" style="left:${56+(i%3)*95}px;top:${218+(i/3|0)*126}px">${cardHTML(c,'m',89,121)}</a>`:`<a class="A" href="#/card/${c.id}" style="left:${384+(i%6)*139.5}px;top:${130+(i/6|0)*122.5}px">${cardHTML(c,'sq',106,108)}</a>`).join('')
   :T_(m?195:780,m?260:300,`没有找到「${esc(lq)}」，换个名词试试`,m?15:20,{cls:'c chalk'});
  if(m){ABH=Math.max(844,218+Math.ceil(L.length/3)*126+90);fit()}};
 $('#s').oninput=e=>{lq=e.target.value;draw()};$('.fil').onclick=e=>{const b=e.target.closest('button');if(!b)return;lf=b.dataset.f;$$('.fil button').forEach(x=>x.setAttribute('aria-pressed',x===b));draw()};draw();
}
const DL={general:'总体',relationship:'感情',career:'事业',wealth:'财富',health:'健康',personality:'性格',appearance:'外形',spirituality:'心灵',environment:'环境','lost-item':'寻物'};
const RIC={感情:'heart',事业:'case',财富:'coin',时间:'moon',建议:'nature'};
function vCard(id,today){const c=C[id-1];if(!c)return go2('#/atlas');const p=C[(id+34)%36],n=C[id%36],m=M();
 const d=k=>clean((c.domains?.[k]||c.domains?.general||[]).join('')),rows=[['感情',d('relationship')],['事业',d('career')],['财富',d('wealth')],['时间',clean(c.timing?.duration||'')||'因牌而定'],['建议',clean((c.advice||[]).join(''))]];
 const kws=(c.nouns||[]).map(clean).filter((x,i,a)=>a.indexOf(x)===i).slice(0,4);
 const h=m?T_(195,192,today?'今日一牌':'牌库图鉴',13,{cls:'c',st:'letter-spacing:.3em'})+A(14,245,cardHTML(c,'m',176,300),{st:'transform:rotate(-3deg)'})+
   A(205,272,`<p style="font-size:17px;font-weight:500;letter-spacing:.06em">${esc(zh(c))} · <span class="en">${esc(c.name)}</span></p><p style="font-size:11px;margin-top:14px;font-weight:600">核心含义：</p><p style="font-size:11.5px;line-height:1.5">${esc(clean(c.summary))}。</p><p style="font-size:10px;margin-top:4px;white-space:nowrap;overflow:hidden">关键词：${esc(kws.join(' · '))}</p>${rows.map(([k,t])=>`<p style="font-size:11px;font-weight:600;margin-top:9px;border-top:1px solid rgba(70,50,25,.25);padding-top:5px">${k}：</p><p style="font-size:11.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(t)}</p>`).join('')}`,{cls:'ink',w:165,h:320,st:'overflow:hidden'})+
   `<nav class="A chalk" aria-label="翻页" style="left:195px;top:620px;transform:translateX(-50%);font-size:17px;white-space:nowrap;display:flex;gap:4px"><a href="#/card/${p.id}">←&nbsp;&nbsp; ${esc(zh(p))}</a><span>·</span><a href="#/card/${n.id}">${esc(zh(n))} &nbsp;&nbsp;→</a></nav>`+chalkSVG('M0 10 Q80 0 150 4',160,120,650,150,12,300)
  :A(386,184,cardHTML(c,'d',300,450).replace('class="card d ','class="card d big '),{st:'transform:rotate(-1.5deg)'})+
   A(790,180,`<p style="font-size:27px;font-weight:500;letter-spacing:.06em">${esc(zh(c))} · <span class="en">${esc(c.name)}</span></p>`,{cls:'ink'})+A(1180,192,`No.${pad(c.id)}`,{cls:'en ink',st:'font-size:14px;transform:translateX(-100%);letter-spacing:.1em'})+
   A(790,250,`<p style="font-size:13px;color:#4a3b28">核心含义</p><p style="font-size:20px;letter-spacing:.06em;margin-top:2px">${esc(clean(c.summary))}</p>`,{cls:'ink',w:390,st:'border-top:1px solid rgba(70,50,25,.3);padding-top:10px;top:240px'})+
   A(790,322,`关键词：${esc(kws.join(' · '))}`,{cls:'ink',w:390,st:'font-size:14px;border-top:1px solid rgba(70,50,25,.3);border-bottom:1px solid rgba(70,50,25,.3);padding:10px 0;white-space:nowrap;overflow:hidden'})+
   `<div class="idx">${rows.map(([k,t],i)=>`<div class="row" style="left:790px;top:${390+i*61.5}px;width:390px;height:44px;${i<4?'border-bottom:1px solid rgba(70,50,25,.25)':''}"><span style="width:28px;height:28px;border-radius:50%;box-shadow:inset 0 0 0 1.3px #3a2c1e;display:inline-flex;align-items:center;justify-content:center;flex:none"><img src="assets/ic/${RIC[k]}.webp" alt="" style="width:16px;height:16px;filter:brightness(.25) sepia(1)"></span><b style="margin:0 0 0 14px;width:60px;font-size:15px">${k}</b><span style="font-size:13.5px" title="${esc(t)}">${esc(t)}</span></div>`).join('')}</div>`+
   `<nav class="A t" aria-label="翻页" style="left:388px;top:704px;width:310px;display:flex;justify-content:space-between;font-size:15px;letter-spacing:.2em"><a href="#/card/${p.id}">←&nbsp;&nbsp; ${esc(zh(p))}</a><a href="#/card/${n.id}">${esc(zh(n))} &nbsp;&nbsp;→</a></nav>`+
   (today?T_(803,110,'今日一牌 · 把它放在心上走过这一天',16,{cls:'chalk c'}):'');
 const v=stage('08-card',h,{ch:m?{by:110,foot:false}:{}});markDrawn(v);
 !RM()&&$('.card',v).animate([{transform:'translate(-24px,16px) rotate(-5deg)',opacity:0},{transform:'none',opacity:1}],{duration:600,easing:'cubic-bezier(.22,.61,.36,1)'});
}
function vHistory(){const hs=LS.get('history',[]),m=M();const fmt=t=>{const d=new Date(t);return`${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())}`};
 const capt=r=>{const c=C[r.ids[r.spread==='nine'?4:r.spread==='five'?2:1]-1];return split2(window.PH[c.id].p)};
 const D=[{c:[194,192,124,186],t:[320,255,131,149],cap:[262,452]},{c:[472,326,124,186],t:[611,404,125,150],cap:[560,600]},{c:[743,220,124,186],t:[889,284,125,148],cap:[858,496]},{c:[1010,376,100,150],t:[1104,581,146,134],cap:[1090,716],three:true}];
 const MD=[{c:[33,233,70,112],t:[255,249,111,78],cap:[300,338],n:3},{c:[60,380,70,112],t:[230,402,120,77],cap:[300,486],n:2},{c:[60,528,70,112],t:[232,543,113,77],cap:[300,628],n:2}];
 let body='',H=m?844:900;
 if(!hs.length)body=T_(m?195:760,m?360:400,'桌上还没有留下记录',m?20:26,{cls:'c chalk'})+`<a class="A btn" href="#/" style="left:${m?195:760}px;top:${m?420:470}px;transform:translateX(-50%);font-size:15px;border-bottom:1px solid rgba(233,207,152,.6)">问第一件事 →</a>`;
 else hs.forEach((r,i)=>{const cs=r.ids.slice(0,3).map(x=>C[x-1]);
  if(m){const g=MD[i%3],oy=Math.floor(i/3)*450;const[x,y,w,hh]=g.c,n=g.n;if(i%3===2&&oy+700>H)H=oy+844;
   const cards=n===3?cs.map((c,k)=>`<div style="position:absolute;left:${k*68}px;top:${k%2?2:0}px;transform:rotate(${(k-1)*1.5}deg)">${cardHTML(c,'m',70,112)}</div>`).join(''):cs.slice(0,2).map((c,k)=>`<div style="position:absolute;left:${k*78}px;top:0;transform:rotate(${k?2:-2}deg)">${cardHTML(c,'m',72,112)}</div>`).join('');
   const bw=n===3?206:152;
   body+=`<div class="bundle" style="left:${x}px;top:${y+oy}px;width:${bw}px;height:${hh}px">${'<div style="position:absolute;inset:4px -3px -6px 3px;background:#cdbf9f;border-radius:6px;box-shadow:0 8px 14px rgba(0,0,0,.6)"></div>'}${cards}<span class="twine"></span><span class="twv" style="left:48%"></span></div>`+
    `<a class="tagp" href="#/reading/${r.id}" style="left:${g.t[0]}px;top:${g.t[1]+oy}px;width:${g.t[2]}px;height:${g.t[3]}px;font-size:12px;padding:8px 6px 6px 18px;line-height:1.5"><time style="font-size:13px">${fmt(r.at)}</time>${esc(r.q.slice(0,16))}${r.q.length>16?'…':''}</a>`+
    T_(g.cap[0],g.cap[1]+oy,capt(r).join('，<br>'),12.5,{cls:'chalk',st:'line-height:1.5'})+`<button class="del t" data-del="${r.id}" style="left:${g.t[0]}px;top:${g.t[1]+g.t[3]+4+oy}px" aria-label="删除这条记录">删去</button>`}
  else{const g=D[i%4],oy=Math.floor(i/4)*520;if(oy+760>H)H=oy+900;const[x,y,w,hh]=g.c;
   const cards=g.three?cs.map((c,k)=>`<div style="position:absolute;left:${k*104}px;top:${k===1?-6:4}px;transform:rotate(${(k-1)*2}deg)">${cardHTML(c,'d',100,150)}</div>`).join(''):[2,1,0].map(k=>`<div style="position:absolute;left:${k*4}px;top:${k*5}px;transform:rotate(${(k-1)*2.5}deg)">${cardHTML(cs[Math.min(k,cs.length-1)],'d',w,hh)}</div>`).join('');
   const bw=g.three?310:w;
   body+=`<div class="bundle" style="left:${x}px;top:${y+oy}px;width:${bw}px;height:${hh}px">${[14,10,6].map(o=>`<div style="position:absolute;left:${o*.5}px;top:${o}px;width:${bw}px;height:${hh}px;background:#c9b996;border-radius:7px;box-shadow:inset 0 0 0 1px rgba(60,40,20,.5),0 6px 12px rgba(0,0,0,.55)"></div>`).join('')}${cards}<span class="twine"></span><span class="twv" style="left:${g.three?52:46}%"></span></div>`+
    `<a class="tagp" href="#/reading/${r.id}" style="left:${g.t[0]}px;top:${g.t[1]+oy}px;width:${g.t[2]}px;height:${g.t[3]}px;font-size:14px;line-height:1.6;transform:rotate(${i%2?-3:4}deg)"><time>${fmt(r.at)}</time>${esc(r.q.slice(0,18))}${r.q.length>18?'…':''}</a>`+
    T_(g.cap[0],g.cap[1]+oy,capt(r).join('，<br>'),13,{cls:'',st:'line-height:1.9;letter-spacing:.14em'})+`<button class="del t" data-del="${r.id}" style="left:${g.t[0]+g.t[2]-30}px;top:${g.t[1]+g.t[3]+10+oy}px" aria-label="删除这条记录">删去</button>`}});
 let path='';if(hs.length>1){const pts=hs.slice(0,m?3:4).map((r,i)=>m?[MD[i].t[0]+MD[i].t[2]/2,MD[i].t[1]+MD[i].t[3]+8]:[D[i].c[0]+D[i].c[2]+40,D[i].c[1]+D[i].c[3]/2]);
  path=`<svg class="A" style="left:0;top:0;width:${m?390:1440}px;height:${H}px;pointer-events:none" aria-hidden="true"><path d="M${pts.map(p=>p.join(' ')).join(' L')}" fill="none" stroke="rgba(240,236,224,.5)" stroke-width="1.4" stroke-dasharray="3 7" stroke-linecap="round"/></svg>`}
 const h=m?T_(195,172,'来路余痕',22,{cls:'c',st:'letter-spacing:.24em'})+T_(195,201,'每一次提问，都是你走过的痕迹。',10.5,{cls:'c mu'})+(hs.length?A(300,180,'清空',{tag:'button',cls:'btn',w:57,h:22,st:'font-size:12px;letter-spacing:.2em;border-radius:12px;box-shadow:inset 0 0 0 1px #8a6a3a;background:rgba(60,40,15,.6)',at:'id="clear"'}):'')+path+body
  :A(500,70,'来路余痕',{cls:'ink',st:'font-size:32px;letter-spacing:.14em;font-weight:500;transform:rotate(-3deg)'})+A(512,124,'那些提问过的问题，依然在照亮你。',{cls:'ink2',st:'font-size:13px;color:#4a3b28;transform:rotate(-3deg)'})+
   A(906,92,'我们走过的路，<br>从不会真正消失，<br>它们只是化作此刻更深的你。',{cls:'t',st:'font-size:12.5px;line-height:1.95'})+A(1167,170,'—— &nbsp;寂境 &nbsp;Stillrealm',{cls:'t',st:'transform:translateX(-100%);font-size:12px'})+
   (hs.length?A(1157,110,'<img src="assets/ic/doc.webp" alt="" style="width:16px;opacity:.8"> 清空',{tag:'button',cls:'btn',w:111,h:42,st:'font-size:14px;letter-spacing:.2em;border-radius:22px',at:'id="clear"'}):'')+path+body;
 const v=stage('09-history',h,{ch:m?{by:92,tabs:true}:{tr:null,bl:['每一次回望，','都是为了更清晰地前行。','—— &nbsp;寂境 &nbsp;Stillrealm'],blY:760},h:H});markDrawn(v);
 v.onclick=e=>{const d=e.target.closest('[data-del]');if(d){LS.set('history',LS.get('history',[]).filter(r=>r.id!==d.dataset.del));vHistory();toast('已删去')}};
 $('#clear')&&($('#clear').onclick=()=>{if(confirm('清空这台设备上的全部记录？')){LS.set('history',[]);vHistory()}});
}
const AMB=[['rain','雨夜'],['fire','炉火'],['still','静室']];
function vSettings(){const m=M(),vs=voices();
 const vopt=`<option value="">${m?'温柔女声':'温柔女声'}</option>${vs.map(v=>`<option ${v.name===prefs.voice?'selected':''}>${esc(v.name)}</option>`).join('')}`;
 const aopt=AMB.map(([k,l])=>`<option value="${k}" ${prefs.amb===k?'selected':''}>${l}</option>`).join('');
 const sw=(id,x,y,w,hh,on,l)=>`<button class="sw" role="switch" id="${id}" aria-checked="${on}" aria-label="${l}" style="left:${x}px;top:${y}px;width:${w}px;height:${hh}px;--sw-w:${w}px"></button>`;
 const h=m?T_(195,186,'声音与设置',17,{cls:'c',st:'letter-spacing:.24em'})+
   [['环境声','自然之声，陪伴此刻',294],['音量','调节聆听的音量',354],['朗读解读','用声音，感受指引',420],['声音','选择喜欢的声音',472],['减少动效','更专注的体验',519]].map(([a,b,y])=>T_(122,y,a,13,{st:'letter-spacing:.14em'})+T_(122,y+19,b,8.5,{cls:'mu'})).join('')+
   [['nature',296],['volume',356],['book',423],['voice',474],['motion',521]].map(([ic,y])=>`<img class="A" src="assets/ic/${ic}.webp" alt="" style="left:74px;top:${y}px;width:24px;height:24px;opacity:.85">`).join('')+
   sw('amb',249,297,44,22,prefs.ambient,'环境声')+T_(301,300,prefs.ambient?'开':'关',10,{cls:'swl',at:'data-k="ambient"'})+T_(301,425,prefs.tts?'开':'关',10,{cls:'swl',at:'data-k="tts"'})+T_(301,525,prefs.reduce?'开':'关',10,{cls:'swl',at:'data-k="reduce"'})+
   `<div class="knob" id="knob" role="slider" tabindex="0" aria-label="音量" aria-valuemin="0" aria-valuemax="100" style="left:239px;top:347px;width:56px;height:56px;background-image:url(assets/sp/knob-m.webp)"></div>`+
   sw('tts',249,422,44,22,prefs.tts,'朗读解读')+`<select class="sel" id="voice" aria-label="声音" style="left:210px;top:470px;width:112px;height:28px;font-size:11.5px">${vopt}</select>`+
   sw('rm',249,522,44,22,prefs.reduce,'减少动效')+
   T_(200,588,chalkText('静听内心的声音'),22,{cls:'c chalk'})+chalkSVG('M0 18 Q90 0 170 4',180,128,626,170,20,900)+
   A(92,735,'<span aria-hidden="true">‹</span>&nbsp; 返回',{tag:'button',cls:'btn hit',w:206,h:43,st:'font-size:15px',at:'id="back"'})+`<select class="sel" id="ambsel" aria-label="环境声音色" style="left:-999px;top:0">${aopt}</select>`
  :A(680,98,'声音与设置',{cls:'ink c',st:'font-size:29px;letter-spacing:.12em;font-weight:500;transform:translateX(-50%) rotate(-3deg)'})+A(682,166,'让合适的声音，陪伴你走向更深的自己。',{cls:'ink2 c',st:'font-size:13px;color:#4a3b28;transform:translateX(-50%) rotate(-3deg);white-space:nowrap'})+
   A(951,100,'一些细微的声音，<br>能让心慢下来，<br>也让你更靠近自己。',{cls:'t',st:'font-size:12.5px;line-height:1.95'})+A(1167,192,'—— &nbsp;寂境 &nbsp;Stillrealm',{cls:'t',st:'transform:translateX(-100%);font-size:12px'})+
   [['环境声',556],['音量',747],['朗读解读',917],['减少动效',1101]].map(([t,x])=>T_(x,341,t,17,{cls:'c',st:'letter-spacing:.14em'})).join('')+
   sw('amb',528,495,58,31,prefs.ambient,'环境声')+`<select class="sel" id="ambsel" aria-label="环境声音色" style="left:486px;top:545px;width:136px;height:33px;font-size:14px">${aopt}</select>`+
   `<div class="knob" id="knob" role="slider" tabindex="0" aria-label="音量" aria-valuemin="0" aria-valuemax="100" style="left:701px;top:408px;width:92px;height:92px;background-image:url(assets/sp/knob-d.webp)"></div>`+T_(679,500,'静',12,{})+T_(806,500,'响',12,{})+
   sw('tts',907,495,58,31,prefs.tts,'朗读解读')+`<select class="sel" id="voice" aria-label="声音" style="left:871px;top:545px;width:132px;height:33px;font-size:14px">${vopt}</select>`+
   sw('rm',1073,467,58,31,prefs.reduce,'减少动效')+T_(1101,530,'让体验更专注<br>更平静。',12.5,{cls:'c',st:'text-align:center;line-height:1.7'})+
   T_(712,662,chalkText('合适的音量，')+'<br>'+chalkText('能让思绪走得更远。',700),17,{cls:'chalk',st:'line-height:1.5'})+chalkSVG('M8 80 Q-4 40 22 4 M14 10 L22 2 L26 12',120,698,566,40,84,200);
 const v=stage('10-sound',h,{ch:m?{by:100,foot:true,back:true}:{bl:['在细微之处，','收藏更安静的自己。']}});markDrawn(v);
 const knob=$('#knob');const setK=()=>{knob.style.transform=`rotate(${-135+prefs.vol*270}deg)`;knob.setAttribute('aria-valuenow',Math.round(prefs.vol*100));knob.setAttribute('aria-valuetext',Math.round(prefs.vol*100)+'%')};setK();
 let kid=null;knob.onpointerdown=e=>{kid=e.pointerId;knob.setPointerCapture(kid)};knob.onpointermove=e=>{if(e.pointerId!==kid)return;const r=knob.getBoundingClientRect();let a=Math.atan2(e.clientY-r.top-r.height/2,e.clientX-r.left-r.width/2)*180/Math.PI+90;if(a>180)a-=360;prefs.vol=Math.max(0,Math.min(1,(a+135)/270));setK();Sound.vol()};
 knob.onpointerup=()=>{kid=null;savePrefs()};knob.onkeydown=e=>{if(/Right|Up/.test(e.key))prefs.vol=Math.min(1,prefs.vol+.05);else if(/Left|Down/.test(e.key))prefs.vol=Math.max(0,prefs.vol-.05);else return;e.preventDefault();setK();Sound.vol();savePrefs()};
 const swf=(id,key,fn)=>{$('#'+id).onclick=e=>{prefs[key]=!prefs[key];e.currentTarget.setAttribute('aria-checked',prefs[key]);savePrefs();$$('.swl').forEach(l=>l.textContent=prefs[l.dataset.k]?'开':'关');fn&&fn()}};
 swf('amb','ambient',()=>prefs.ambient?Sound.start():Sound.stop());swf('tts','tts');swf('rm','reduce');
 $('#voice').onchange=e=>{prefs.voice=e.target.value;savePrefs();Voice.speak('静下来，听见内心的声音。')};
 $('#ambsel').onchange=e=>{prefs.amb=e.target.value;savePrefs();if(Sound.on){Sound.stop();setTimeout(()=>Sound.start(),1400)}};
 $('#back')&&($('#back').onclick=()=>history.length>1?history.back():go2('#/'));
}
/* ================= router ================= */
let cleanup=[];
function go2(h){if(location.hash===h)route();else location.hash=h}
function route(){cleanup.forEach(f=>f());cleanup=[];World.clear();window.speechSynthesis?.cancel();$('#sheet').hidden=true;
 const h=location.hash.replace(/^#/,'')||'/';const[,a,b]=h.split('/');document.body.dataset.r=a||'';
 ({'':vLanding,topic:vTopic,spread:vSpread,draw:vDraw,reading:()=>vReading(b),atlas:vAtlas,card:()=>vCard(+b),history:vHistory,settings:vSettings,today:()=>{const d=new Date();vCard((d.getFullYear()*372+d.getMonth()*31+d.getDate())%36+1,true)}}[a||'']||vLanding)();
 const nav={atlas:'atlas',card:'atlas',history:'history',settings:'settings',today:'today'}[a]||'read';
 $$('[data-nav]').forEach(x=>x.dataset.nav===nav?x.setAttribute('aria-current','page'):x.removeAttribute('aria-current'));
 const T2={topic:'选择方向',spread:'选择牌阵',draw:'洗牌与抽牌',reading:'解读',atlas:'牌库图鉴',card:'牌义',history:'我的记录',settings:'声音设置',today:'心灵札记'}[a];
 document.title=(T2?T2+' · ':'')+'寂境 · 雷诺曼';scrollTo(0,0);main.focus({preventScroll:true})}
addEventListener('hashchange',route);route();
if(prefs.ambient)addEventListener('pointerdown',()=>{if(prefs.ambient&&!Sound.on)Sound.start()},{once:true});
speechSynthesis?.addEventListener?.('voiceschanged',()=>{if(location.hash==='#/settings')vSettings()});
})();
