(()=>{
const C=window.CARDS,T=window.TOPICS,TPL=window.TEMPLATES,G=window.GLYPHS;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const main=$('#main');
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const roman=n=>{const m=[[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];let r='';for(const[v,s]of [[30,'XXX'],[20,'XX']].concat(m)){}let x=n;for(const[v,s]of [[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']]){while(x>=v){r+=s;x-=v}}return r};
const zh=c=>c.localizedNames?.zh||c.aliases?.[0]||c.name;
const clean=s=>String(s||'').replace(/\s+/g,' ').replace(/[，,。]\s*$/,'').trim();
const POLAR={positive:'吉',negative:'凶',neutral:'中'};
const cardHTML=(c,tag='div',attrs='')=>`<${tag} class="card" ${attrs}><span class="no">${roman(c.id)}<i>${POLAR[c.polarity]||''}</i></span><svg viewBox="0 0 100 100" aria-hidden="true">${G[c.id]}</svg><span class="nm"><b>${esc(zh(c))}</b><small>${esc(c.name)}</small></span></${tag}>`;
const backHTML=()=>`<div class="card back" aria-hidden="true"><span>S</span></div>`;
const SPREADS={three:{name:'三张线性牌',count:3,desc:'看清变化',pos:['起因','此刻','走向']},
 five:{name:'五张线性牌',count:5,desc:'看见关系',pos:['来处','近因','核心','近果','去向']},
 nine:{name:'九张肖像牌阵',count:9,desc:'展开全貌',pos:['过去·隐','过去','过去·显','此刻·隐','核心','此刻·显','未来·隐','未来','未来·显']}};
const DOMKEY={relationship:'relationship',career:'career',wealth:'wealth','lost-item':'lost-item',decision:'general',overview:'general'};
const store={get(){try{return JSON.parse(localStorage.getItem('stillrealm.history')||'[]')}catch{return[]}},set(v){localStorage.setItem('stillrealm.history',JSON.stringify(v))}};
let S={topic:'relationship',q:'',facts:'',spread:null,picked:[]};
try{Object.assign(S,JSON.parse(sessionStorage.getItem('stillrealm.draft')||'{}'))}catch{}
const save=()=>sessionStorage.setItem('stillrealm.draft',JSON.stringify(S));
const toast=m=>{const t=$('.toast');t.textContent=m;t.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('on'),2200)};
const steps=n=>`<ol class="steps" aria-label="进度">${['写下问题','选择牌阵','抽牌','读牌'].map((s,i)=>`<li class="${i<n?'done':i===n?'on':''}" ${i===n?'aria-current="step"':''}>${s}</li>`).join('')}</ol>`;
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- sound: zero-cost WebAudio drone + speechSynthesis ---------- */
const Sound={ctx:null,on:false,nodes:[],
 toggle(){this.on?this.stop():this.start();return this.on},
 start(){const A=window.AudioContext||window.webkitAudioContext;if(!A)return;this.ctx=this.ctx||new A();const c=this.ctx;c.resume();
  const out=c.createGain();out.gain.value=0;out.connect(c.destination);out.gain.linearRampToValueAtTime(.05,c.currentTime+4);
  const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=900;lp.connect(out);
  [55,82.4,110,164.8,220.6].forEach((f,i)=>{const o=c.createOscillator();o.type=i%2?'sine':'triangle';o.frequency.value=f;o.detune.value=(i-2)*4;
   const g=c.createGain();g.gain.value=.18/(i+1);const l=c.createOscillator();l.frequency.value=.03+i*.017;const lg=c.createGain();lg.gain.value=.08/(i+1);l.connect(lg).connect(g.gain);
   o.connect(g).connect(lp);o.start();l.start();this.nodes.push(o,l)});
  this.out=out;this.on=true;sync()},
 stop(){if(!this.ctx)return;const c=this.ctx,o=this.out,n=this.nodes;o.gain.cancelScheduledValues(c.currentTime);o.gain.setValueAtTime(o.gain.value,c.currentTime);o.gain.linearRampToValueAtTime(0,c.currentTime+1.5);
  setTimeout(()=>n.forEach(x=>{try{x.stop()}catch{}}),1600);this.nodes=[];this.on=false;sync()}};
function sync(){$$('[data-sound]').forEach(b=>b.setAttribute('aria-pressed',Sound.on))}
const soundBtn=`<button class="sound" data-sound aria-pressed="false" aria-label="环境声"><span class="bars" aria-hidden="true"><i></i><i></i><i></i></span>声</button>`;
const Voice={speaking:false,
 speak(text,btn){const s=window.speechSynthesis;if(!s){toast('此浏览器不支持朗读');return}
  if(this.speaking){s.cancel();this.speaking=false;btn.setAttribute('aria-pressed','false');btn.lastChild.textContent='朗读';return}
  const u=new SpeechSynthesisUtterance(text);u.lang='zh-CN';u.rate=.88;u.pitch=.95;
  const v=s.getVoices().find(v=>/zh[-_]CN/i.test(v.lang)&&/Xiaoxiao|Yunxi|Natural|Ting/i.test(v.name))||s.getVoices().find(v=>/zh/i.test(v.lang));if(v)u.voice=v;
  u.onend=u.onerror=()=>{this.speaking=false;btn.setAttribute('aria-pressed','false');btn.lastChild.textContent='朗读'};
  s.speak(u);this.speaking=true;btn.setAttribute('aria-pressed','true');btn.lastChild.textContent='停止'}};
$('.masthead nav').insertAdjacentHTML('afterend','');
{const n=$('.masthead nav');const w=document.createElement('div');w.className='right';n.replaceWith(w);w.append(n);w.insertAdjacentHTML('beforeend',soundBtn)}
document.addEventListener('click',e=>{const b=e.target.closest('[data-sound]');if(b)Sound.toggle()});

/* ---------- interpretation engine (local, deterministic) ---------- */
function domText(c,topic){const k=DOMKEY[topic]||'general';const arr=(c.domains?.[k]?.length?c.domains[k]:c.domains?.general)||[];return clean(arr.join(''))}
function noun(c){const n=(c.nouns||[]).map(clean).find(x=>x&&x!==zh(c)&&!(c.aliases||[]).includes(x));return n||clean(c.summary)}
function mod(c){return clean((c.modifiers||[])[0]||(c.actions||[])[0]||'')}
function interpret(r){
 const cards=r.ids.map(id=>C[id-1]),sp=SPREADS[r.spread],tl=T.find(t=>t.id===r.topic)||T[0];
 const pairs=[];for(let i=0;i<cards.length-1;i++){const a=cards[i],b=cards[i+1];pairs.push(`「${zh(a)}」的${noun(a)}，遇上「${zh(b)}」，便带着${mod(b)?mod(b)+'的':''}${noun(b)}的意味`)}
 const pol=cards.reduce((s,c)=>s+(c.polarity==='positive'?1:c.polarity==='negative'?-1:0),0);
 const tone=pol>1?'整体的风是顺的，事情愿意向前':pol<-1?'整体偏向阻滞，先看清代价，再决定是否推进':'局面仍在摇摆，旁边的一张牌就能改变它的方向';
 const core=r.spread==='nine'?cards[4]:r.spread==='five'?cards[2]:cards[1];
 const sentence=`${zh(cards[0])}之后是${zh(cards[1])}${cards[2]?'，而'+zh(cards[cards.length-1])+'在尽头等着':''}。`;
 const head=cards.slice(0,3).map(c=>`<em>${esc(clean(c.summary))}</em>`).join('，');
 return {cards,sp,tl,pairs,tone,core,sentence,head,
  advice:clean(core.advice?.[0]||'')||'先完成手上最小的一步。',
  caution:clean(cards.map(c=>c.cautions?.[0]).find(Boolean)||''),
  timing:clean(cards[cards.length-1].timing?.duration||'')};
}

/* ---------- views ---------- */
function viewAsk(){
 const tl=T.find(t=>t.id===S.topic)||T[0];
 main.innerHTML=`<div class="view">
 <div class="ask">
  <div class="ask-side">
   <p class="eyebrow">Lenormand · 引导式占卜</p>
   <h1 class="display">尚未说出的事<em>What remains unsaid</em></h1>
   <p class="lede">雷诺曼不预言命运，它把牌连成句子。先把困惑写成一个可以被观察的问题——越具体，牌越清楚。</p>
   <div class="stack" aria-hidden="true">${cardHTML(C[31])}${cardHTML(C[25])}${cardHTML(C[32])}</div>
  </div>
  <form class="ask-form" novalidate>
   ${steps(0).replace('margin:40px','')}
   <fieldset style="margin-top:40px"><legend class="label">这次想看</legend>
    <div class="topics">${T.map(t=>`<label class="topic"><input type="radio" name="topic" value="${t.id}" ${t.id===S.topic?'checked':''}><b>${esc(t.label)}</b><small>${esc(t.whisper)}</small></label>`).join('')}</div>
   </fieldset>
   <div class="question"><label class="label" for="q">想要看见什么</label>
    <textarea id="q" maxlength="600" placeholder="${esc(tl.placeholder)}">${esc(S.q)}</textarea>
    <div class="row"><span class="meta">写下一件事、一个时间范围</span><span class="count" aria-live="polite"><span id="cnt">${S.q.length}</span> / 600</span></div>
   </div>
   <div class="extras">
    <details><summary>借一句问法</summary><ul class="tpls"></ul></details>
    <details ${S.facts?'open':''}><summary>补充已知事实（可选）</summary><textarea class="facts" id="facts" maxlength="400" placeholder="已经发生了什么？例如：上周对方回复变少。">${esc(S.facts)}</textarea></details>
   </div>
   <button class="cta" type="submit" ${S.q.trim().length<4?'disabled':''}>确认问题<span class="arrow" aria-hidden="true"></span></button>
  </form>
 </div></div>`;
 const f=$('.ask-form'),q=$('#q'),cta=$('.cta',f);
 const fillT=()=>{$('.tpls').innerHTML=TPL.filter(t=>t.domain===S.topic).map(t=>`<li><button type="button" data-t="${esc(t.template)}"><b>${esc(t.label)}</b><small>${esc(t.hint)}</small></button></li>`).join('')};
 fillT();
 f.addEventListener('change',e=>{if(e.target.name==='topic'){S.topic=e.target.value;q.placeholder=T.find(t=>t.id===S.topic).placeholder;fillT();save()}});
 q.addEventListener('input',()=>{S.q=q.value;$('#cnt').textContent=q.value.length;cta.disabled=q.value.trim().length<4;save()});
 $('#facts').addEventListener('input',e=>{S.facts=e.target.value;save()});
 $('.tpls').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;q.value=S.q=b.dataset.t;q.dispatchEvent(new Event('input'));q.focus();b.closest('details').open=false});
 f.addEventListener('submit',e=>{e.preventDefault();if(S.q.trim().length<4)return;go('#/spread')});
}
function recommend(){const q=S.q;if(/还是|或者|哪一个|二选一|两条/.test(q)||S.topic==='decision')return'five';if(S.topic==='overview'||q.length>90)return'nine';return'three'}
function viewSpread(){
 if(!S.q.trim())return go('#/');
 const rec=recommend();S.spread=S.spread||rec;
 main.innerHTML=`<div class="view">${steps(1)}
 <p class="eyebrow" style="margin-top:56px">Choose how far to look</p><h1 class="h2" style="margin-top:20px">选择牌阵</h1>
 <p class="quote">${esc(S.q)}</p>
 <form class="spread-form"><fieldset><legend class="sr">牌阵</legend><div class="spreads" role="radiogroup">
 ${Object.entries(SPREADS).map(([id,s])=>`<label class="spread"><input type="radio" name="sp" value="${id}" ${S.spread===id?'checked':''}><span class="n">${s.count}</span>${id===rec?'<span class="rec">推荐</span>':''}<b>${s.name}</b><p>${s.desc} · ${s.pos.slice(0,3).join(' / ')}${s.count>3?' …':''}</p><span class="mini" aria-hidden="true">${'<i></i>'.repeat(s.count)}</span></label>`).join('')}
 </div></fieldset>
 <div class="actions"><button class="cta" type="submit">去抽牌<span class="arrow" aria-hidden="true"></span></button><a class="ghost" href="#/">修改问题</a></div></form></div>`;
 const f=$('.spread-form');f.addEventListener('change',e=>{S.spread=e.target.value;save()});
 f.addEventListener('submit',e=>{e.preventDefault();S.picked=[];save();go('#/draw')});
}
let deckOrder=[];
function viewDraw(){
 if(!S.spread)return go('#/spread');
 const sp=SPREADS[S.spread];deckOrder=deckOrder.length?deckOrder:shuffle([...Array(36)].map((_,i)=>i+1));
 main.innerHTML=`<div class="view">${steps(2)}
 <p class="eyebrow" style="margin-top:56px">Into the quiet</p><h1 class="h2" style="margin-top:20px">静下来，选 ${sp.count} 张</h1>
 <p class="lede">不必思考哪一张是对的。让手停在第一眼注意到的位置。</p>
 <div class="deck" role="group" aria-label="牌堆，共三十六张">${deckOrder.map((id,i)=>`<button type="button" data-id="${id}" aria-pressed="false" aria-label="第 ${i+1} 张背面朝上的牌">${backHTML()}</button>`).join('')}</div>
 <div class="drawbar"><p class="tally" aria-live="polite"><span id="tal">0</span><small> / ${sp.count}</small></p>
 <div class="actions" style="margin-top:0"><button class="ghost" type="button" id="auto">替我抽</button><a class="ghost" href="#/spread">更换牌阵</a><button class="cta" id="rev" disabled>翻开<span class="arrow" aria-hidden="true"></span></button></div></div></div>`;
 const deck=$('.deck'),upd=()=>{$$('button',deck).forEach(b=>{const k=S.picked.indexOf(+b.dataset.id);b.setAttribute('aria-pressed',k>-1);b.dataset.order=k>-1?roman(k+1):'';b.disabled=k<0&&S.picked.length>=sp.count});$('#tal').textContent=S.picked.length;$('#rev').disabled=S.picked.length<sp.count};
 deck.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const id=+b.dataset.id,k=S.picked.indexOf(id);k>-1?S.picked.splice(k,1):S.picked.length<sp.count&&S.picked.push(id);upd()});
 $('#auto').onclick=()=>{S.picked=shuffle([...deckOrder]).slice(0,sp.count);upd()};
 $('#rev').onclick=()=>{const rec={id:Date.now().toString(36),at:Date.now(),topic:S.topic,q:S.q,facts:S.facts,spread:S.spread,ids:[...S.picked]};sessionStorage.setItem('stillrealm.current',JSON.stringify(rec));deckOrder=[];go('#/reading/'+rec.id)};
 upd();
}
function shuffle(a){const r=new Uint32Array(a.length);crypto.getRandomValues(r);for(let i=a.length-1;i>0;i--){const j=r[i]%(i+1);[a[i],a[j]]=[a[j],a[i]]}return a}
function viewReading(id){
 let rec=store.get().find(r=>r.id===id);const saved=!!rec;
 if(!rec){try{const c=JSON.parse(sessionStorage.getItem('stillrealm.current'));if(c?.id===id)rec=c}catch{}}
 if(!rec)return go('#/history');
 const R=interpret(rec);
 const narration=[rec.q,R.sentence,R.tone,...R.cards.map((c,i)=>`${R.sp.pos[i]}，${zh(c)}：${clean(c.summary)}。`),'建议：'+R.advice].join('。');
 main.innerHTML=`<div class="view">${saved?'':steps(3)}
 <p class="eyebrow" style="margin-top:56px">${esc(R.tl.label)} · ${esc(R.sp.name)}</p>
 <p class="quote" style="margin-top:20px">${esc(rec.q)}</p>
 <div class="table ${rec.spread}">${R.cards.map((c,i)=>`<div class="slot"><span class="pos">${String(i+1).padStart(2,'0')} · ${R.sp.pos[i]}</span><a class="flip" href="#/card/${c.id}" aria-label="${R.sp.pos[i]}：${esc(zh(c))}，查看牌义"><span class="in">${backHTML()}${cardHTML(c,'div','').replace('class="card"','class="card face"')}</span></a></div>`).join('')}</div>
 <p class="sentence reveal">${R.head}。</p>
 <div class="prose">
  <section class="reveal"><h3>牌句 <i>The sentence</i></h3><p>${esc(R.sentence)}${esc(R.tone)}。</p>${R.pairs.slice(0,4).map(p=>`<p>${esc(p)}。</p>`).join('')}</section>
  ${R.cards.map((c,i)=>`<section class="reveal"><h3>${R.sp.pos[i]} · ${esc(zh(c))} <i>${esc(c.name)}</i></h3><p>${esc(clean(c.summary))}。${esc(domText(c,rec.topic))}</p></section>`).join('')}
  <section class="reveal"><h3>可以做的一步 <i>Advice</i></h3><p>${esc(R.advice)}</p>${R.caution?`<p class="note">留意：${esc(R.caution)}</p>`:''}${R.timing?`<p class="note">时间感：${esc(R.timing)}</p>`:''}</section>
  ${rec.facts?`<section class="reveal"><h3>你补充的事实</h3><p>${esc(rec.facts)}</p></section>`:''}
  <div class="actions">${saved?'':'<button class="cta" id="keep">保存这次解读<span class="arrow" aria-hidden="true"></span></button>'}
   <button class="sound" id="tts" aria-pressed="false"><span class="bars" aria-hidden="true"><i></i><i></i><i></i></span><span>朗读</span></button>
   <button class="ghost" id="copy">复制文字</button><a class="ghost" href="#/" id="again">再问一件事</a></div>
 </div></div>`;
 const flips=$$('.flip');flips.forEach((f,i)=>setTimeout(()=>f.classList.add('shown'),reduce?0:500+i*(rec.spread==='nine'?220:420)));
 const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{rootMargin:'0px 0px -8% 0px'});
 $$('.reveal').forEach(el=>io.observe(el));
 $('#keep')&&($('#keep').onclick=e=>{store.set([rec,...store.get()].slice(0,100));e.currentTarget.remove();toast('已保存在这台设备')});
 $('#copy').onclick=()=>navigator.clipboard?.writeText(main.querySelector('.prose').innerText.replace(/保存这次解读|朗读|复制文字|再问一件事/g,'').trim()).then(()=>toast('已复制'));
 $('#tts').onclick=e=>Voice.speak(narration,e.currentTarget);
 $('#again').onclick=()=>{S={topic:S.topic,q:'',facts:'',spread:null,picked:[]};save()};
}
let lq='',lf='all';
function viewLearn(){
 main.innerHTML=`<div class="view"><p class="eyebrow" style="margin-top:56px">Atlas of traces</p><h1 class="display" style="font-size:clamp(36px,6vw,72px)">寂境图志</h1>
 <p class="lede">三十六张牌，各自是一个名词。组合在一起，才成为一句话。先从单牌的核心象征开始。</p>
 <div class="tools"><label class="sr" for="s">搜索牌名、别名或关键词</label><input class="search" id="s" type="search" placeholder="搜索：骑士、Ship、消息…" value="${esc(lq)}">
 <div class="filters" role="group" aria-label="倾向">${[['all','全部'],['positive','吉'],['neutral','中'],['negative','凶']].map(([k,l])=>`<button type="button" data-f="${k}" aria-pressed="${lf===k}">${l}</button>`).join('')}</div></div>
 <div class="grid" aria-live="polite"></div></div>`;
 const draw=()=>{const q=lq.trim().toLowerCase();const list=C.filter(c=>(lf==='all'||c.polarity===lf)&&(!q||[c.name,zh(c),...(c.aliases||[]),...(c.nouns||[]),...(c.tags||[]),String(c.id)].join(' ').toLowerCase().includes(q)));
  $('.grid').innerHTML=list.length?list.map(c=>`<a class="tile" href="#/card/${c.id}">${cardHTML(c)}<p>${esc(clean(c.summary))}</p></a>`).join(''):`<p class="empty">没有找到「${esc(lq)}」。试试牌名或一个名词。</p>`};
 $('#s').addEventListener('input',e=>{lq=e.target.value;draw()});
 $('.filters').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;lf=b.dataset.f;$$('.filters button').forEach(x=>x.setAttribute('aria-pressed',x===b));draw()});
 draw();
}
const DLABEL={general:'总体',career:'事业',relationship:'感情',wealth:'财富',appearance:'外形',personality:'性格',health:'健康',spirituality:'心灵',environment:'环境','lost-item':'寻物'};
function viewCard(id){
 const c=C[id-1];if(!c)return go('#/learn');const p=C[(id+34)%36],n=C[id%36];
 main.innerHTML=`<div class="view"><p class="eyebrow" style="margin-top:56px"><a href="#/learn" style="text-decoration:none">图志</a> · ${roman(c.id)}</p>
 <div class="detail">${cardHTML(c)}<div>
 <h1 class="display" style="margin-top:0;font-size:clamp(40px,6vw,72px)">${esc(zh(c))}<em>${esc(c.name)} · No.${c.id}</em></h1>
 <p class="lede">${esc(clean(c.summary))}。</p>
 <div class="words">${(c.nouns||[]).slice(0,10).map(w=>`<span>${esc(clean(w))}</span>`).join('')}</div>
 <dl class="dl">${Object.entries(c.domains||{}).filter(([,v])=>v?.length).map(([k,v])=>`<div><dt>${DLABEL[k]||k}</dt><dd>${esc(clean(v.join('')))}</dd></div>`).join('')}
 ${c.advice?.length?`<div><dt>建议</dt><dd>${esc(clean(c.advice.join(' ')))}</dd></div>`:''}
 ${c.cautions?.length?`<div><dt>留意</dt><dd>${esc(clean(c.cautions.join(' ')))}</dd></div>`:''}
 ${c.timing?.duration?`<div><dt>时间</dt><dd>${esc(clean(c.timing.duration))}</dd></div>`:''}
 ${c.pokerCard?`<div><dt>扑克对应</dt><dd>${esc(clean(c.pokerCard))}</dd></div>`:''}
 ${c.aliases?.length?`<div><dt>别名</dt><dd>${esc(c.aliases.join(' · '))}</dd></div>`:''}</dl>
 <nav class="pager" aria-label="翻页"><a href="#/card/${p.id}">← ${esc(zh(p))}</a><a href="#/card/${n.id}">${esc(zh(n))} →</a></nav>
 </div></div></div>`;
}
function viewHistory(){
 const h=store.get();const fmt=t=>new Date(t).toLocaleDateString('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit'});
 main.innerHTML=`<div class="view"><p class="eyebrow" style="margin-top:56px">The road behind · 只在这台设备</p><h1 class="display" style="font-size:clamp(36px,6vw,72px)">来路余痕</h1>
 <p class="lede">这里只显示你主动保存的完整解读。可以逐条删除，也可以一次清空。</p>
 ${h.length?`<ul class="hist">${h.map(r=>`<li><time datetime="${new Date(r.at).toISOString()}">${fmt(r.at)}</time><div><a href="#/reading/${r.id}">${esc(r.q)}</a><span class="cards">${esc(SPREADS[r.spread]?.name||'')} · ${r.ids.map(i=>zh(C[i-1])).join(' · ')}</span></div><button data-del="${r.id}" aria-label="删除这条记录">删除</button></li>`).join('')}</ul>
 <div class="actions"><button class="ghost" id="clear">清空全部</button></div>`:`<p class="empty">还没有留下记录。<br><a class="ghost" href="#/" style="display:inline-block;margin-top:24px">问第一件事</a></p>`}</div>`;
 main.addEventListener('click',onHist);
}
function onHist(e){const d=e.target.closest('[data-del]');if(d){store.set(store.get().filter(r=>r.id!==d.dataset.del));viewHistory();toast('已删除')}
 if(e.target.id==='clear'&&confirm('清空这台设备上的全部记录？')){store.set([]);viewHistory()}}

/* ---------- router ---------- */
function go(h){location.hash=h}
function route(){
 main.removeEventListener('click',onHist);window.speechSynthesis?.cancel();
 const h=location.hash.replace(/^#/,'')||'/';const [,a,b]=h.split('/');
 const nav=a==='learn'||a==='card'?'learn':a==='history'?'history':'read';
 $$('nav a').forEach(x=>x.dataset.nav===nav?x.setAttribute('aria-current','page'):x.removeAttribute('aria-current'));
 ({'':viewAsk,spread:viewSpread,draw:viewDraw,reading:()=>viewReading(b),learn:viewLearn,card:()=>viewCard(+b),history:viewHistory}[a||'']||viewAsk)();
 document.title=({learn:'学牌',card:'牌义',history:'来路',reading:'解读',draw:'抽牌',spread:'牌阵'}[a]?({learn:'学牌',card:'牌义',history:'来路',reading:'解读',draw:'抽牌',spread:'牌阵'}[a]+' · '):'')+'寂境 · 雷诺曼';
 window.scrollTo({top:0,behavior:'instant'});main.focus({preventScroll:true});
}
addEventListener('hashchange',route);route();
})();
