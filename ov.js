/* Overlay states 11–17, 23 — plate+overlay layouts matched to concepts/C-screens-v2 */
(()=>{'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const L=()=>window.LJ,mode=()=>L().M()?'mobile':'desktop',ab=()=>$('#ab');
const P=(k)=>`assets/plate2/${k}-${mode()}.webp`;
function platefor(host,k){let im=host.querySelector(':scope>img.ovp');if(!im){im=document.createElement('img');im.className='ovp';im.alt='';im.setAttribute('aria-hidden','true');host.prepend(im)}window.PERF?PERF.set(im,P(k)):(im.src.endsWith(P(k))||(im.src=P(k)))}
const KEY={glance:'13-glance',cards:'14-onecard',deep:'15-deeper',story:'16-story',restore:'23-restore'};
const CN=['一','二','三','四'];
/* ---------- reading sheet ---------- */
function sheet(sh,st,rec,R,ro){const{esc,zh,clean}=L();const a=ab();if(sh.parentElement!==a)a.appendChild(sh);
 sh.classList.add('ovs');const sc=$('.sc',sh);$$(':scope>.ovchalk,:scope>.ovdeco',sh).forEach(x=>x.remove());const dm=!L().M(),cs=R.cards,deco=(c,x,y,w,r)=>sh.insertAdjacentHTML('beforeend',`<div class="ovdeco" aria-hidden="true" style="left:${x}px;top:${y}px;transform:rotate(${r}deg)">${L().cardHTML(c,'d',w)}</div>`);
 if(st.tab==='glance')$$('.clues li',sc).forEach(li=>{const t=li.textContent,i=t.indexOf('：');if(i<0)return;let h=t.slice(0,i);h=h.includes('·')?h.split('·').pop().trim():h.replace(/^核心线索/,'核心');li.innerHTML=`<b>${esc(h.replace(/[「」]/g,''))}</b><span>${esc(t.slice(i+1))}</span>`});
 if(dm&&st.tab==='deep')deco(cs[cs.length-1],1083,272,150,6);
 if(!dm&&st.tab==='story'){cs.slice(0,3).forEach((c,i)=>deco(c,62+i*94,592,78,0));sh.insertAdjacentHTML('beforeend',`<p class="ovdeco chalk" aria-hidden="true" style="left:195px;top:728px;transform:translateX(-50%);font-size:18px;white-space:nowrap">${esc(window.PH[cs[0].id].s)}</p>`)}
 if(dm&&st.tab==='story'){deco(cs[0],290,470,150,-8);if(cs[1])deco(cs[1],1080,250,150,4);if(cs[2])deco(cs[2],1085,530,150,-3);sh.insertAdjacentHTML('beforeend','<p class="ovdeco chalk" aria-hidden="true" style="left:1120px;top:112px;font-size:19px;line-height:1.4;transform:rotate(-12deg)">让故事，<br>慢慢浮现。</p>')}const k=KEY[st.tab]||'13-glance';sh.dataset.k=k;platefor(sh,k);
 if(st.tab==='cards'){sc.insertAdjacentHTML('afterbegin','<h2 class="ovt">解读你的牌阵</h2>');
  const c=R.cards[st.i],one=$('.one',sc);if(one){const k2=$('.kick',one);if(k2)$('.oc',one).prepend(k2)}
  const ch=$('.chalkp',sc);if(ch){ch.classList.add('chalk','ovchalk');sh.appendChild(ch)}}
 if(st.tab==='deep')sc.insertAdjacentHTML('afterbegin','<h2 class="ovt">继续深入</h2>');
 if(st.tab==='story'){const S2=st.story;const h=$('.cht',sc);if(h&&S2){h.textContent=`第${CN[st.ch]}章 · ${S2[st.ch].t}`;
   h.insertAdjacentHTML('afterend',`<nav class="chn" aria-label="章节">${S2.map((c,i)=>`<button class="lk ${i===st.ch?'on':''}" data-chn="${i-st.ch}" ${i===st.ch?'aria-current="true"':''}>${c.t}</button>`).join('<i aria-hidden="true">·</i>')}</nav><hr class="orn">`);
   const pg=$('.pager2',sc);if(pg){pg.insertAdjacentHTML('beforebegin','<hr class="orn b">');const sp=$('span',pg);if(sp)sp.remove();
     const[b1,b2]=$$('button',pg);if(b1)b1.innerHTML='‹ 上一章';if(b2)b2.innerHTML='下一章 ›'}}}
 if(st.tab==='restore'){$('.strip',sc)?.remove();$('.tabs',sc)?.remove();$('footer',sc)?.remove()}
 if(!dm&&st.tab==='story'){const nv=$('.chn',sc);if(nv){nv.classList.add('ovdeco','chnm');sh.appendChild(nv);nv.onclick=e=>{const b=e.target.closest('[data-chn]');if(!b)return;const t=document.createElement('button');t.dataset.chn=b.dataset.chn;t.hidden=true;sc.appendChild(t);t.click()}}}
}
function restore(rec,R,st){const{esc,zh,cardHTML,STORY}=L();const d=new Date(rec.saved||rec.at||Date.now());const ds=`${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
 const ans=Object.values(rec.answers||{}).filter(Boolean);let lines=ans.slice(0,3);
 if(!lines.length){const G=window.STORY.glance(rec);lines=[G.headline]}
 const n=R.cards.length,m=L().M();
 return`<a class="rback" href="#/history">← 返回我的记录</a><div class="rp"><p class="stamp">只读 · 来自 ${ds}</p><p class="rq">${esc(rec.q)}</p><h3 class="rh">回应</h3><p class="rsv">已保存</p><p class="rsub">${ans.length?'当时的回应':'当时的初见'}</p>
 <ol class="rans">${lines.map(x=>`<li>${esc(x)}</li>`).join('')}</ol><p class="rlinks"><button class="lk" data-t="glance">初见</button><button class="lk" data-t="cards">逐张看</button><button class="lk" data-t="story" id="rstory">完整故事 ›</button></p><button class="lk rnew" id="newq">换一个问题</button></div>
 <p class="rchalk chalk">已恢复当时的牌阵</p><div class="rcards n${Math.min(n,9)}">${R.cards.slice(0,m?3:(n>5?5:n)).map((c,i)=>`<button class="thc" data-c="${i}" aria-label="${esc(R.sp.pos[i])} · ${esc(zh(c))}">${cardHTML(c,'d',m?96:(n>3?118:150))}</button>`).join('')}</div>`}
/* ---------- keep dialog ---------- */
function keep(p,rec){const dlg=$('#dlg');const a=ab();a.appendChild(dlg);dlg.classList.add('ovk');p.classList.add('ovkp');
 p.style.setProperty('--pl',`url(${P('17-keep')})`);
 const h=$('h3',p);if(h){h.textContent='收进来路余痕';h.insertAdjacentHTML('afterend','<hr class="orn">')}
 $('.mu2',p)?.remove();const q=$('.qq',p);if(q)q.textContent=`“${rec.q}”`;
 const lb=$('.ck',p);if(lb){const t=[...lb.childNodes].find(n=>n.nodeType===3&&n.textContent.trim());if(t)t.textContent=' 一并保存我的追问回答';if(!(rec.answers&&Object.values(rec.answers).some(Boolean)))lb.style.display='none'}
 const mo=new MutationObserver(()=>{if(dlg.hidden){dlg.classList.remove('ovk');document.body.appendChild(dlg);mo.disconnect()}});mo.observe(dlg,{attributes:true,attributeFilter:['hidden']})}
/* ---------- loading ---------- */
function loading(o){const{esc,cardHTML}=L();const S=L().S,a=ab();a.appendChild(o);o.classList.add('ovl');platefor(o,'12-loading');
 const n=Math.min((L().SPREADS[S.spread]||{count:3}).count,5),m=L().M();
 const backs=Array.from({length:m?3:Math.min(n,5)},(_,i)=>`<div class="lw"><div class="card back"></div></div>`).join('');
 o.insertAdjacentHTML('beforeend',`<div class="lnote"><p class="k">此刻 · 你的问题</p><p class="q">${esc(S.q||'')}</p></div><div class="lcards n${m?3:Math.min(n,5)}">${backs}</div>`);
 const ll=$('.ll',o);if(ll){const ps=$$('p',ll);if(ps.length>3)ps.slice(3).forEach(x=>x.remove())}}
/* ---------- 11: ask ---------- */
const CH=[['relationship','关于关系'],['career','关于事业'],['overview','关于自己'],['decision','关于选择'],['wealth','关于财富'],['lost-item','关于线索']];
function ask(){const{stage,A,T_,esc,markDrawn,cardHTML,chalkText,TPL,C,save}=L();const S=L().S,m=L().M();S.cs=S.cs||0;
 const chips=()=>[0,1,2].map(i=>CH[(S.cs*3+i)%CH.length]);
 const sug=t=>{const Ls=TPL.filter(x=>x.domain===t);S.si=(S.si||0)+1;return Ls.length?Ls[S.si%Ls.length].template:''};
 const html=m?
  T_(195,196,'向卡片提出你的问题',12,{cls:'c',st:'letter-spacing:.24em'})+A(268,212,'把心里的疑问，<br>轻轻写下',{cls:'chalk',st:'font-size:14px;line-height:1.3;transform:rotate(-8deg);text-align:right;width:100px'})+
  `<label class="sr" for="q">写下你想问的事</label><textarea id="q" class="A qin ovq" maxlength="600" placeholder="写下此刻，你最想问的问题…" style="left:62px;top:282px;width:270px;height:92px;font:500 18px/1.48 var(--serif);letter-spacing:.06em">${esc(S.q)}</textarea>`+
  A(338,374,`<span id="cnt">${S.q.length}</span> / 600`,{cls:'en ink2',st:'transform:translateX(-100%);font-size:11px'})+
  T_(195,421,'试着这样问',10,{cls:'c mu',st:'letter-spacing:.3em'})+
  `<div id="sugs">${[0,1,2].map(i=>`<button class="A sugr" data-i="${i}" style="left:80px;top:${437+i*34}px;width:230px;height:26px"></button>`).join('')}</div>`+
  `<button class="A lk swapg" id="swap" style="left:195px;top:540px;transform:translateX(-50%);font-size:11px;color:#e9cf98">换一组灵感 ↻</button>`+
  A(112,560,cardHTML(C[13],'d',62),{st:'transform:rotate(-10deg)'})+A(150,550,cardHTML(C[32],'d',88),{})+A(218,560,cardHTML(C[8],'d',62),{st:'transform:rotate(10deg)'})+
  A(35,686,'开始占卜 <span aria-hidden="true">→</span>',{tag:'button',cls:'btn hit',w:320,h:40,st:'font-size:16px',at:'id="go"'})+
  T_(195,745,'更清晰的自己',9.5,{cls:'c mu',st:'letter-spacing:.3em'})
 :T_(499,209,'此刻 · 你的问题',12,{cls:'ink2',st:'letter-spacing:.14em'})+T_(512,282,'写下此刻，你最想问的问题',14,{cls:'ink2'})+
  `<label class="sr" for="q">写下你想问的事</label><textarea id="q" class="A qin ovq" maxlength="600" placeholder="我该如何……" style="left:512px;top:318px;width:440px;height:130px;font:500 23px/1.6 var(--serif);letter-spacing:.06em">${esc(S.q)}</textarea>`+
  A(948,470,`<span id="cnt">${S.q.length}</span> / 600`,{cls:'en ink2',st:'transform:translateX(-100%);font-size:13px'})+
  `<button class="A lk" id="factsb" style="left:512px;top:466px;font-size:12.5px;color:#5a4220">＋ 补充事实（可选）</button>`+
  A(721,568,'<i class="ln"></i>让问题具体一些，也让心慢下来。<i class="ln"></i>',{cls:'c t',st:'font-size:14px;letter-spacing:.14em;display:flex;align-items:center;gap:14px;white-space:nowrap'})+
  `<div id="sugs">${[0,1,2].map(i=>`<button class="A chip" data-i="${i}" style="left:${516+i*143}px;top:597px;width:122px;height:41px"></button>`).join('')}</div>`+
  `<button class="A lk swapg" id="swap" style="left:1000px;top:607px;font-size:12.5px;color:#e9cf98">换一组灵感 ↻</button>`+
  A(595,696,'开始仪式 <span aria-hidden="true">→</span>',{tag:'button',cls:'btn hit',w:254,h:55,st:'font-size:19px',at:'id="go"'})+
  A(1030,220,cardHTML(C[0],'d',150),{st:'transform:rotate(6deg)'})+A(1150,330,cardHTML(C[1],'d',150),{st:'transform:rotate(14deg)'})+
  A(1255,120,'卡牌不是预言，<br>而是让你听见内在声音的另一种语言。',{cls:'t',st:'transform:translateX(-100%);font-size:12.5px;line-height:1.95;text-align:left'})+A(1255,170,'—— &nbsp;Stillrealm',{cls:'t',st:'transform:translateX(-100%);font-size:12px'});
 const v=stage('../plate2/11-suggest',html,m?{ch:{by:103,tabs:true}}:{ch:{bl:['36 张卡牌','无预设的未来','只有更清晰的你']}});markDrawn(v);
 const q=$('#q'),go=$('#go');
 const paint=()=>{const cs=chips();$$('#sugs button').forEach((b,i)=>{if(m){const t=cs[i][0];const L2=TPL.filter(x=>x.domain===t);const s=L2.length?L2[(S.cs+i)%L2.length].template:'';b.dataset.s=s;b.innerHTML=`<span>${esc(s)}</span><i aria-hidden="true">✎</i>`}else{b.dataset.t=cs[i][0];b.textContent=cs[i][1]}})};paint();
 $('#sugs').onclick=e=>{const b=e.target.closest('button');if(!b)return;const s=m?b.dataset.s:sug(b.dataset.t);if(!m)S.topic=b.dataset.t;q.value=s;S.q=s;$('#cnt').textContent=s.length;save();q.focus()};
 $('#swap').onclick=()=>{S.cs=(S.cs||0)+1;save();paint()};
 q.addEventListener('input',()=>{S.q=q.value;$('#cnt').textContent=q.value.length;save()});
 go.onclick=()=>{if(!q.value.trim()){L().toast('先写下你想问的事');q.focus();return}L().go2('#/topic')};
 const fb=$('#factsb');if(fb)fb.onclick=()=>L().go2('#/topic')}
window.OV={sheet,restore,keep,loading,ask};
})();
