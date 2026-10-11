/* 纯模板叙事引擎：无后端、无 AI。所有文字由下方词库按种子组合。 */
(()=>{
const C=window.CARDS,PH=window.PH;
const clean=s=>String(s||'').normalize('NFKC').replace(/\s+/g,'').replace(/[，,。；;、]+$/,'');
const zh=c=>c.localizedNames?.zh||c.aliases?.[0]||c.name;
const noun=c=>(c.nouns||[]).map(clean).find(x=>x&&x!==zh(c)&&x.length<=4)||clean(c.summary).slice(0,4);
function rng(seed){let h=2166136261;for(const ch of String(seed))h=Math.imul(h^ch.charCodeAt(0),16777619);return()=>{h+=0x6D2B79F5;let t=h;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
const pick=(r,a)=>a[Math.floor(r()*a.length)];
const fill=(t,v)=>t.replace(/\{(\w+)\}/g,(_,k)=>v[k]??'');
const TOPIC={relationship:{n:'感情',obj:'这段关系',who:'那个人',scene:['深夜未回的消息','两个人沉默的饭桌','一起走过的街口','对话框里删了又写的一句话']},
 career:{n:'事业',obj:'这份工作',who:'同事与上司',scene:['早上通勤的地铁','会议室里没说出口的建议','加班后熄灯的办公楼','邮箱里那封迟迟未回的信']},
 wealth:{n:'财富',obj:'手上的钱与资源',who:'与你利益相关的人',scene:['月底对账的夜晚','犹豫要不要按下的付款键','抽屉里的旧账本','一笔反复计算过的开销']},
 'lost-item':{n:'寻物',obj:'那样遗失的东西',who:'最后见过它的人',scene:['翻过三遍的抽屉','回想中模糊的路线','口袋里空空的手','某个被忽略的角落']},
 decision:{n:'抉择',obj:'眼前的两条路',who:'会被你的决定牵动的人',scene:['摊开的两张纸','走到一半又折回的路口','夜里反复权衡的清单','一个迟迟没有落下的签名']},
 overview:{n:'近况',obj:'接下来这段日子',who:'身边的人',scene:['清晨拉开的窗帘','日历上空着的格子','一杯慢慢变凉的茶','周末无人打扰的午后']}};
const POL=c=>c.polarity==='positive'?1:c.polarity==='negative'?-1:0;
/* ---------- 跟进问题题库 ---------- */
const QB={
 relationship:[
  {q:'此刻，你们之间最常出现的是哪一种气氛？',o:['平静，但有些疏远','温暖，却说不出口','紧绷，一碰就会争执','若即若离，看不清']},
  {q:'在这段关系里，你最想守住的是什么？',o:['彼此的信任','自己的边界','共同的日常','一个可能的未来']},
  {q:'如果明天就要见到对方，你会先说哪句话？',o:['最近好吗','对不起','我想你了','我们谈谈吧']},
  {q:'你觉得自己在这段关系里更像——',o:['等待的人','追赶的人','守着门的人','准备离开的人']},
  {q:'过去三个月，让你最在意的一件事属于——',o:['一次争执','一次冷淡','一个承诺','一个陌生的名字']}],
 career:[
  {q:'眼下工作里最消耗你的是什么？',o:['重复的琐事','复杂的人际','看不到的方向','过高的期待']},
  {q:'如果可以改变一件事，你会选择——',o:['换一个团队','换一种做法','换一个城市','先什么都不换']},
  {q:'你最近一次感到被认可，是在什么时候？',o:['这个月','半年内','很久以前','想不起来了']},
  {q:'对于下一步，你更接近哪种心情？',o:['跃跃欲试','谨慎观望','有点疲惫','想要停下来']},
  {q:'你手上最重要的资源是——',o:['专业能力','人脉','时间','耐心']}],
 wealth:[
  {q:'你现在对钱最主要的感受是——',o:['安稳','焦虑','期待','麻木']},
  {q:'近期最大的一笔支出或收入与什么有关？',o:['家庭','投资','工作变动','一次冲动']},
  {q:'如果有一笔意外的钱，你会——',o:['存起来','投出去','花在自己身上','分给在意的人']},
  {q:'你更担心哪一种情况？',o:['收入停滞','开支失控','判断失误','被人拖累']}],
 'lost-item':[
  {q:'你最后一次确定它还在，是在——',o:['家里','路上','工作的地方','别人那里']},
  {q:'它对你而言更重要的是——',o:['实际用处','纪念意义','里面的信息','说不清，只是放不下']},
  {q:'丢失前后，你的状态是——',o:['匆忙','分心','疲惫','和平常一样']},
  {q:'有没有人可能知道它的去向？',o:['家人','朋友','同事','没有人']}],
 decision:[
  {q:'两个选项里，哪一个让你更心动？',o:['更稳妥的那个','更冒险的那个','两个都不太想要','还没想清楚']},
  {q:'你在害怕失去什么？',o:['安全感','机会','某个人','原来的自己']},
  {q:'这个决定的期限是——',o:['这几天','一个月内','半年内','没有期限']},
  {q:'如果没人评判，你会怎么选？',o:['立刻改变','维持原状','先试一小步','等等再看']}],
 overview:[
  {q:'最近的你，更像哪一种天气？',o:['晴而微凉','阴天','雨后','起风了']},
  {q:'生活里哪一块最需要照看？',o:['身体','关系','工作','内心']},
  {q:'你希望接下来的日子多一点——',o:['安静','变化','陪伴','勇气']},
  {q:'有没有一件事，你一直在拖？',o:['有，而且很重要','有，但不急','没有','不确定']}]};
const CARDQ=[
 {ids:[24,25,28,29],q:'牌面里出现了与人心相连的牌，你心里是否有一个具体的人？',o:['有，很清楚','有，但不确定','没有','不想说']},
 {ids:[3,10,15,26,36],q:'有一张牌暗示着变动或代价，你是否已经在为改变做准备？',o:['已经开始','有在想','还没有','不想改变']},
 {ids:[6,8,14,23],q:'有一张牌带着阴影，最近有什么让你隐隐不安？',o:['一个人','一件事','一笔账','说不上来']},
 {ids:[2,9,16,31,33],q:'牌面里有一束光，你最期待的好消息是什么？',o:['关于人','关于工作','关于钱','关于自己']},
 {ids:[4,5,20,21,35],q:'有一张牌在说"稳"，你此刻最想抓住的是什么？',o:['一个家','一份坚持','一段健康','一种节奏']}];
function followups(rec){const r=rng(rec.id+'q'),bank=(QB[rec.topic]||QB.overview).slice();const out=[];
 while(out.length<3&&bank.length)out.push(bank.splice(Math.floor(r()*bank.length),1)[0]);
 const cq=CARDQ.find(x=>rec.ids.some(i=>x.ids.includes(i)));if(cq)out.push(cq);return out}
/* ---------- 词库 ---------- */
const OPEN=['在{scene}里，你问出了这件事：「{q}」','它大概是在{scene}时浮上来的——「{q}」','桌上的灯照着一张纸，纸上写着：「{q}」','你把这个问题放在桌上很久了：「{q}」'];
const HEAD={1:['风向在转好，{core}在前方等你','{core}已经亮起，门是半开着的','这件事比你以为的更有希望'],0:['局面仍在摇摆，{core}是那根秤杆','答案还没有落定，关键在{core}','事情停在半路，等你轻轻推一下'],'-1':['先慢下来，{core}提醒你看清代价','有一处阴影需要先被照亮','这条路有坎，但不是走不过去']};
const CONC={1:['整体倾向顺利：{a}先铺好了路，{b}让它走得更远。','牌面偏暖。{a}与{b}彼此呼应，事情愿意向前。'],0:['牌面在中间摇摆：{a}与{b}各拉一端，你的选择会决定重心。','没有明显的吉凶，{a}与{b}之间的那一步，由你来迈。'],'-1':['牌面偏冷：{a}带来阻滞，{b}提醒你别急着推进。','此刻不宜硬闯。{a}与{b}都在说：先看清，再动。']};
const CH1=['{pos}落下的是「{card}」。{s}，{meaning}。','第{n}张牌是「{card}」，放在{pos}的位置——{s}。它说的是{meaning}。','翻开{pos}，是「{card}」：{meaning}；像{s}。'];
const PAIR=['「{a}」与「{b}」并排时，读作：{line}。','从「{a}」走到「{b}」，是一句完整的话：{line}。','这两张牌靠在一起，{line}。'];
const STO=['故事从{scene}开始。{facts}{first}，{mid}。到了最后，{last}。','如果把这{n}张牌连成一条路：起点是{first}；中途，{mid}；尽头，{last}。{facts}','{facts}你站在{scene}里。先是{first}，接着{mid}，而{last}。'];
const SURE=['你给这件事的确定感是 {lv} 分。','你说自己有 {lv} 分的把握。'];
const SUREX={lo:'分数不高，说明你心里还有很多没被说出的东西——这很正常，故事正是为它们而写。',mid:'不高也不低，你正站在门槛上，一只脚已经迈出。',hi:'你已经相当笃定，牌面要做的，只是帮你确认方向。'};
const REAL=['回到现实，「{core}」落在{obj}上，意味着{dom}。','放回{topic}这件事里，{core}说的是：{dom}。','现实层面，{dom}——这是「{core}」给{obj}的提示。'];
const ANSW=['你说{ans}，','你提到{ans}，','你选择了「{ans}」，'];
const ANSF=['这让{card}的意思更清楚了：{mean}。','它与「{card}」对上了——{mean}。','于是「{card}」不再只是一张牌，而是你说的那件事本身：{mean}。'];
const RESP=['可以做的一小步：{adv}。','如果只做一件事，就去{adv}。','不必一次走完，先{adv}。'];
const CAUT=['留意：{cau}。','别忽略这一点——{cau}。'];
const TIME=['时间感：{tm}。','这件事的节奏大约是{tm}。'];
const CLOSE={1:['灯还亮着，你已经知道往哪里走了。','门开着，剩下的路，你自己会走。'],0:['答案没有被写死，你手里还握着笔。','牌只是镜子，接下来的一句，由你来写。'],'-1':['慢一点并不是输，是在为更好的出发攒力气。','阴影只是说明，那边有光。']};
const SIZE={3:'三张牌像三个镜头：来处、此刻、去向。',5:'五张牌铺开，是一条有前因也有后果的路。',9:'九宫格里，过去、此刻、未来各占一行，彼此互相照见。'};
function ctx(rec){const cards=rec.ids.map(i=>C[i-1]),n=cards.length,T=TOPIC[rec.topic]||TOPIC.overview,pos=window.SPREADS_POS[rec.spread];
 const core=n===9?cards[4]:n===5?cards[2]:cards[1],pol=Math.sign(cards.reduce((s,c)=>s+POL(c),0));
 const dk={relationship:'relationship',career:'career',wealth:'wealth','lost-item':'lost-item'}[rec.topic]||'general';
 const dom=c=>clean(((c.domains?.[dk]?.length?c.domains[dk]:c.domains?.general)||[]).join('')).slice(0,40)||clean(c.summary);
 return{cards,n,T,pos,core,pol,dom}}
function glance(rec){const r=rng(rec.id+'g'),{cards,n,T,pos,core,pol,dom}=ctx(rec);const a=cards[0],b=cards[n-1];
 return{headline:fill(pick(r,HEAD[pol]),{core:zh(core)}),conclusion:fill(pick(r,CONC[pol]),{a:zh(a),b:zh(b)})+' '+SIZE[n],
  clues:cards.slice(0,Math.min(n,5)).map((c,i)=>`${pos[i]} · ${zh(c)}：${PH[c.id].s}`).concat(n>1?[`核心线索：「${zh(core)}」——${clean(core.summary)}`]:[])}}
function story(rec,ans,lv){const r=rng(rec.id+'s'),{cards,n,T,pos,core,pol,dom}=ctx(rec);const scene=pick(r,T.scene);ans=ans||{};
 const fq=followups(rec);
 const facts=rec.facts?`你写下的事实是：「${clean(rec.facts).slice(0,120)}」。`:'';
 const show=cards.length>5?[0,1,2,4,6,7,8]:cards.map((_,i)=>i);
 const ch1=[fill(pick(r,OPEN),{scene,q:rec.q}),SIZE[n]].concat(show.map(i=>fill(pick(r,CH1),{pos:pos[i],card:zh(cards[i]),s:PH[cards[i].id].s,meaning:clean(cards[i].summary),n:i+1})));
 const pairs=[];for(let i=0;i<n-1&&pairs.length<4;i+=(n===9?2:1)){const A=cards[i],B=cards[i+1];pairs.push(fill(pick(r,PAIR),{a:zh(A),b:zh(B),line:`${PH[A.id].s}，${PH[B.id].p}`}))}
 const ch2=[fill(pick(r,STO),{scene,facts,n,first:PH[cards[0].id].s,mid:PH[core.id].p,last:PH[cards[n-1].id].p})].concat(pairs);
 const ch3=[fill(pick(r,REAL),{core:zh(core),obj:T.obj,topic:T.n,dom:dom(core)})];
 if(lv)ch3.push(fill(pick(r,SURE),{lv})+(lv<=3?SUREX.lo:lv<=7?SUREX.mid:SUREX.hi));
 fq.forEach((f,i)=>{const v=ans[i];if(!v)return;const c=cards[(i+1)%n];ch3.push(`${f.q.replace(/？$/,'')}——`+fill(pick(r,ANSW),{ans:v})+fill(pick(r,ANSF),{card:zh(c),mean:dom(c)}))});
 if(!Object.values(ans).some(Boolean))ch3.push(`牌面也提到了${T.who}：${dom(cards[n-1])}。`);
 const adv=clean(core.advice?.[0]||cards.map(c=>c.advice?.[0]).find(Boolean)||'先完成手上最小的一步');
 const cau=clean(cards.map(c=>c.cautions?.[0]).find(Boolean)||''),tm=clean(cards[n-1].timing?.duration||'');
 const ch4=[fill(pick(r,RESP),{adv})].concat(cau?[fill(pick(r,CAUT),{cau})]:[]).concat(tm?[fill(pick(r,TIME),{tm})]:[]).concat([pick(r,CLOSE[pol])]);
 return[{t:'牌迹',p:ch1},{t:'故事',p:ch2},{t:'现实',p:ch3},{t:'回应',p:ch4}]}
window.STORY={followups,glance,story,rng};
})();
