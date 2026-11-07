/* ---- Yaklaşan dersler + hatırlatıcı ---- */
const GUNL=['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];
const dhc=()=>({on:true,dk:30,aksam:true,...(W.dhat||{})});
const hmp=t=>{const m=String(t||'').match(/(\d{1,2})[:.](\d{2})/);return m?[+m[1],+m[2]]:null};
async function yDers(){const a=await recs(W.id,'ders'),now=new Date(),out=[];
 for(let o=0;o<=7;o++){const d=new Date(now.getFullYear(),now.getMonth(),now.getDate()+o),g=GUNL[d.getDay()];
  a.forEach(r=>meets(r).forEach(m=>{if(m.gun!==g)return;const s=hmp(m.s),f=hmp(m.e),Y=d.getFullYear(),M=d.getMonth(),D=d.getDate();
   const st=s?new Date(Y,M,D,s[0],s[1]):new Date(Y,M,D,0,0),en=f?new Date(Y,M,D,f[0],f[1]):s?new Date(st.getTime()+60*6e4):new Date(Y,M,D,23,59);
   if(en>now)out.push({r,m,o,d,st,en,tm:!!s})}))}
 return out.sort((p,q)=>p.st-q.st)}
const cdTxt=st=>{const k=Math.round((st-new Date())/6e4);if(k<=0)return'Devam ediyor';return k<60?k+' dk sonra':Math.floor(k/60)+' sa '+(k%60?k%60+' dk ':'')+'sonra'};
async function dyList(){const yd=await yDers(),near=yd.filter(x=>x.o<=1),show=near.length?near:yd.slice(0,1),nx=yd[0];
 return show.map(x=>{const w=x.o===0?'Bugün':x.o===1?'Yarın':GUNL[x.d.getDay()]+' (en yakın ders)',hi=x===nx;
  return `<div class="it" style="${hi?'border-color:var(--ac);background:var(--ac2)':''}"><div><b>${e(x.r.ad)}</b><small>${w} ${e(x.m.s||'')}${x.m.e?'–'+e(x.m.e):''} ${e(x.m.yer||'')}</small></div>${x.o===0&&x.tm?`<span class="dcd" data-t="${+x.st}" style="font-size:12px;color:var(--ac);white-space:nowrap">${cdTxt(x.st)}</span>`:''}</div>`})}
function dhNotes(){try{return JSON.parse(localStorage.getItem('dhN')||'{}')}catch(x){return window.__dhN||{}}}
function dhSave(o){const k=Object.keys(o).slice(-200),n={};k.forEach(i=>n[i]=1);window.__dhN=n;try{localStorage.setItem('dhN',JSON.stringify(n))}catch(x){}}
function dhNtf(t,b){toast('🔔 '+t+' — '+b);try{if(window.Notification&&Notification.permission==='granted')new Notification(t,{body:b})}catch(x){}}
async function dhCheck(){try{if(typeof W==='undefined'||!W||!W.id)return;
 document.querySelectorAll('.dcd').forEach(s=>{s.textContent=cdTxt(+s.dataset.t)});
 const c=dhc();if(!c.on)return;const now=new Date(),ls=dhNotes(),yd=await yDers();let ch=0;
 for(const x of yd){if(!x.tm||x.o>0)continue;const df=(x.st-now)/6e4;if(df<=c.dk&&df>-1){const k=iso(x.st)+'|'+x.r.id+'|'+x.m.s;if(!ls[k]){ls[k]=1;ch=1;dhNtf(x.r.ad,(df<=1?'şimdi başlıyor':Math.round(df)+' dk sonra')+(x.m.yer?' · '+x.m.yer:''))}}}
 if(c.aksam&&now.getHours()>=20){const tk=iso(new Date(now.getFullYear(),now.getMonth(),now.getDate()+1)),k='ak|'+tk,tm=yd.filter(x=>x.o===1);if(!ls[k]&&tm.length){ls[k]=1;ch=1;dhNtf('Yarınki dersler',tm.map(x=>(x.m.s||'')+' '+x.r.ad).join(', '))}}
 if(ch)dhSave(ls)}catch(x){}}
function dhSet(){const c=dhc(),pm=window.Notification?Notification.permission:'yok';
 dlg(`<h3 id="dhk">🔔 Ders hatırlatıcısı</h3><div class="chk"><input type="checkbox" id="dh1" ${c.on?'checked':''}><span>Hatırlatıcı açık</span></div><label>Ders başlamadan önce<select id="dh2">${[10,15,30,45,60,120].map(v=>`<option value="${v}" ${v===c.dk?'selected':''}>${v} dakika</option>`).join('')}</select></label><div class="chk"><input type="checkbox" id="dh3" ${c.aksam?'checked':''}><span>Akşam 20:00'den sonra yarınki dersleri hatırlat</span></div><p class="m">${pm==='granted'?'Tarayıcı bildirimleri açık ✅':pm==='denied'?'Tarayıcı bildirimleri engellenmiş. Tarayıcı ayarlarından izin verebilirsin; o zamana kadar hatırlatmalar sayfada uyarı olarak çıkar.':pm==='yok'?'Bu tarayıcı bildirimleri desteklemiyor, hatırlatmalar sayfada uyarı olarak çıkar.':'Kaydedince tarayıcı bildirim izni isteyeceğim.'}</p><p class="m">Hatırlatmalar bu sayfa/uygulama açıkken çalışır. Kapalıyken bildirim gelmez.</p><div class="row"><button onclick="dlg()">Vazgeç</button><button class="p" onclick="dhOk()">Kaydet</button></div>`)}
function dhOk(){const on=$('dh1').checked;try{if(on&&window.Notification&&Notification.permission==='default')Notification.requestPermission().catch(()=>{})}catch(x){}
 const o={on,dk:+$('dh2').value,aksam:$('dh3').checked};dlg();upd({dhat:o});toast(on?'Hatırlatıcı açık ✅':'Hatırlatıcı kapatıldı')}
setInterval(dhCheck,30000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)dhCheck()});
