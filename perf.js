/* Perf layer: AVIF plates with WebP fallback, blurred LQ placeholder, decode-before-swap,
   decoded-image cache, idle prefetch of the next likely screen, idle font warm-up, SW. */
(()=>{'use strict';
const cache=new Map();let avif=false;
const t=new Image();const avifReady=new Promise(r=>{t.onload=()=>{avif=t.width>0;window.AVIF=avif;r()};t.onerror=()=>r()});t.src='data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=';
const real=u=>avif&&/assets\/plate2?\/.*\.webp$/.test(u)?u.replace(/\.webp$/,'.avif'):u;
function load(u){let p=cache.get(u);if(p)return p;const im=new Image();im.decoding='async';
 p=avifReady.then(()=>new Promise(res=>{const done=()=>res(im);im.onload=()=>{(im.decode?im.decode():Promise.resolve()).then(done,done)};
  im.onerror=()=>{if(im.src.endsWith('.avif')){im.src=u}else done()};im.src=real(u)}));p.img=im;cache.set(u,p);return p}
function set(el,u,onSwap){if(el.dataset.want===u)return;el.dataset.want=u;const p=cache.get(u);
 if(p&&p.img.complete&&p.img.naturalWidth){el.src=p.img.src;onSwap&&onSwap();return}
 const lq=(window.LQ||{})[u];if(lq){el.src=lq;onSwap&&onSwap()}
 load(u).then(im=>{if(el.dataset.want===u){el.src=im.src;onSwap&&onSwap()}})}
const NEXT={'01-landing':['02-topic','11-suggest'],'02-topic':['03-spread'],'03-spread':['04-draw'],'04-draw':['05-reading3','06-reading9','05-five','12-loading'],
 '05-reading3':['13-glance','14-onecard'],'05-five':['13-glance','14-onecard'],'06-reading9':['13-glance','14-onecard'],'13-glance':['14-onecard','15-deeper'],'14-onecard':['15-deeper'],'15-deeper':['16-story'],'16-story':['17-keep'],
 '07-atlas':['08-card'],'08-card':['07-atlas'],'09-history':['23-restore'],'11-suggest':['02-topic']};
const P2=new Set(['11-suggest','12-loading','13-glance','14-onecard','15-deeper','16-story','17-keep','23-restore']);
const url=(k,m)=>`assets/${P2.has(k)?'plate2':'plate'}/${k}-${m}.webp`;
const idle=window.requestIdleCallback||(f=>setTimeout(f,300));
function prefetch(key,m){idle(()=>(NEXT[key]||[]).forEach(k=>load(url(k,m))),{timeout:2500})}
function plate(el,u){const k=(u.match(/\/([^/]+)-(desktop|mobile)\.webp$/)||[]);
 set(el,u,()=>{const f=document.getElementById('fill');if(f&&el.classList.contains('plate'))f.style.backgroundImage=`url(${el.src})`});if(k[1])prefetch(k[1],k[2])}
/* fonts + rarely used assets: warm up once the first screen has settled */
addEventListener('load',()=>setTimeout(()=>idle(()=>{
 const s='的一是了我不人在他有这个上们来到时大地为子中你说生国年着就那和要她出也得里后自以会';
 ['400','500','600'].forEach(w=>document.fonts.load(`${w} 16px "Noto Serif SC"`,s).catch(()=>{}));['16px "Long Cang"','600 16px "Cormorant Garamond"','italic 500 16px "Cormorant Garamond"','500 16px "Cormorant Garamond"'].forEach(f=>document.fonts.load(f,'洗牌 Abc').catch(()=>{}));
 const tst=new Image();tst.onload=()=>document.querySelector('.toast')?.classList.add('seen');tst.src='assets/v2/nf-m.webp'}),2500));
if('serviceWorker' in navigator&&location.protocol==='https:')addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
window.PERF={plate,set,load,prefetch};
})();
