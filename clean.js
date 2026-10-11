/* Light-touch clean layer over data.js: original wording kept; punctuation normalised to Chinese,
   fields cut at a clause boundary (never mid-word, no "…"), dangling 1–2 char fragments dropped. */
window.CLEANF=(()=>{
 const sp=t=>(t||'').replace(/[\u2E80-\u2FDF]/g,ch=>String.fromCharCode(ch.charCodeAt(0)===0x2F00?0x4E00:ch.normalize('NFKC').charCodeAt(0))).normalize('NFKC');
 const norm=t=>sp(t).replace(/\.\.\.|…|⋯/g,'').replace(/[（(][^)）]*[)）]/g,'').replace(/\s*,\s*/g,'，').replace(/;/g,'；').replace(/:/g,'：').replace(/([\u4e00-\u9fff])\s+(?=[\u4e00-\u9fff])/g,'$1，').replace(/\s+/g,'').replace(/[，、]{2,}/g,'，').replace(/。，|，。/g,'。').replace(/^[，。；]+/,'');
 const cut=(t,n)=>{const ps=norm(t).split(/(?<=[，。；？！])/).filter(Boolean);
  while(ps.length>1&&ps[ps.length-1].replace(/[，。；？！]/g,'').length<=2)ps.pop();
  let o='';for(const p of ps){if((o+p).length>n&&o)break;if(p.replace(/[，。；？！]/g,'').length<=2&&o)continue;o+=p}
  if(o.length>n+6){const q=o.slice(0,n);const i=Math.max(q.lastIndexOf('，'),q.lastIndexOf('、'));o=i>6?q.slice(0,i):q}
  return o.replace(/[，；、：]+$/,'').replace(/。?$/,'。')};
const FIX={8:{love:'单身短期内不能脱单，自己知道原因；双方痛苦被捆绑，互相折磨。'},32:{love:'单身个人有吸引力有魅力，如果这段时间内出现了特别吸引你的人。'},
 13:{advice:'简单工作，新的项目工种。'},16:{advice:'要共同完成，共同设想多，对感情充满希望。'},21:{advice:'需要绕开或放下，需要花时间；日积月累形成的大山，需要你想办法解决。'},
 23:{advice:'需要重视，留意悄悄消耗你的东西。'},26:{advice:'不要着急，需要更多学习，需要大胆展现自己。'},27:{advice:'需要被传递，正式的、纸质的协议，相敬如宾。'},
 32:{advice:'需要被认可，强调专业方面获得的成功。'},33:{advice:'要核心，需要主动开发挖掘，需要主动把握。'},35:{advice:'需要自身花费很大力气才能维持稳定，相对动态的固定，需要经常走动。'}};
 const j=a=>(a||[]).join('');
 return(c,n=40)=>{const D=c.domains||{},g=j(D.general);const f=k=>cut(j(D[k]).trim()?j(D[k]):g,n);
  const adv=(c.advice||[]).filter(x=>!/[們這個裡說麼會時讀與當問傳決]/.test(x));
  const kw=[...new Set((c.nouns||[]).map(x=>sp(x).replace(/[\[\]./]/g,'').trim()).filter(Boolean))].slice(0,4);
  const F=FIX[c.id]||{},o={core:norm(c.summary).replace(/。?$/,'。'),kw,love:f('relationship'),work:f('career'),money:f('wealth'),
   time:c.timing?.duration?cut(c.timing.duration,Math.min(n,16)):'因牌而定。',advice:cut(j(adv).trim()?j(adv):(c.advice||[]).join('')||g,n)};for(const k in F)o[k]=n<40?cut(F[k],n):F[k];return o}})();
