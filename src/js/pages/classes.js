/* ---- PDF'den ders programı ---- */
const PGN=['Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi','Pazar'];
const DAYM=[['pazartesi','pzt','pts'],['salı','sal','sali'],['çarşamba','çar','carsamba','çrş'],['perşembe','per','persembe','prş'],['cuma','cum'],['cumartesi','cmt','cts'],['pazar','paz','pzr']];
const trl=s=>String(s).toLocaleLowerCase('tr').replace(/\s+/g,' ').trim();
const dayOf=t=>{const x=trl(t).replace(/[.:,()\/]/g,' ').trim().split(' ')[0];for(let i=0;i<7;i++)if(DAYM[i].includes(x))return i;return -1};
const p2=n=>String(n).padStart(2,'0');
const tms=t=>[...String(t).matchAll(/(^|[^\d])([01]?\d|2[0-3])[:.]([0-5]\d)(?!\d)/g)].map(m=>p2(m[2])+':'+m[3]);
const HOCA=/^(prof|doç|dr|öğr|arş|okt|yrd)(?![\p{L}])/iu,TR=/\s+((?:[A-ZÇĞİÖŞÜ]{1,4}-?\d{1,3}[A-Z]?)|(?:Amfi|Lab)\s?\d*)$/,CODE=/^([A-ZÇĞİÖŞÜ]{2,5}\s?-?\s?\d{3,4}[A-Z]?)(?:\s+|$)/,ROOM=/^(?:[A-ZÇĞİÖŞÜ]{1,4}[-\s]?\d{1,3}[A-Z]?|(?:Amfi|AMFİ|Lab|LAB|Laboratuvar|Derslik|Salon|Sınıf)\b.{0,14})$/;
function clus(items){const a=[...items].sort((p,q)=>p.y-q.y||p.x-q.x),L=[];
 for(const i of a){const l=L[L.length-1];if(l&&Math.abs(i.y-l.y)<=Math.max(2,.45*Math.min(i.h,l.h))){l.it.push(i);l.y=(l.y*(l.it.length-1)+i.y)/l.it.length;l.h=Math.max(l.h,i.h)}else L.push({y:i.y,h:i.h,it:[i]})}
 L.forEach(l=>l.it.sort((p,q)=>p.x-q.x));return L}
function segs(l){const o=[];for(const i of l.it){const s=o[o.length-1];if(s&&i.x-s.x1<=Math.max(.9*l.h,4)){s.t+=(i.x-s.x1>.15*l.h?' ':'')+i.t;s.x1=i.x+i.w}else o.push({x0:i.x,x1:i.x+i.w,t:i.t})}return o}
function findHdr(L){for(const l of L){const d=[];segs(l).forEach(s=>{const g=dayOf(s.t);if(g>=0&&s.t.length<=24)d.push({g,x0:s.x0,x1:s.x1})});if(new Set(d.map(x=>x.g)).size>=3)return{y:l.y,h:l.h,cols:d}}return null}
const RMK=/(\d|salon|amfi|lab|derslik|sınıf|konferans|atölye)/i,UPN=/^[\p{Lu}\s.'’-]{5,}$/u;
function cell(tx){let kod='',ad=[],yer='',hoca='',kr=0;
 for(let t of tx){t=String(t).trim();if(!t)continue;
  {const km=t.match(/(?:\b(?:AKTS|ECTS|KREDİ|KREDI)\s*[:=]?\s*(\d{1,2})(?!\d))|(?:(?<![\d:.])(\d{1,2})\s*(?:AKTS|ECTS)\b)/i);if(km){kr=+(km[1]||km[2]);t=t.replace(km[0],'').replace(/[()\[\]]/g,' ').replace(/\s+/g,' ').trim();if(!t)continue}}
  if(HOCA.test(t)){hoca=hoca?hoca+' '+t:t;continue}
  const m=t.match(CODE);if(m&&!kod&&!ad.length){kod=m[1].replace(/\s+/g,'');t=t.slice(m[0].length).replace(/^[-–—:]\s*/,'').trim();if(!t)continue}
  if(ad.length){
   if(!yer&&RMK.test(t)&&t.length<=40){yer=t;continue}
   if(!hoca&&UPN.test(t)&&t.split(' ').length>=2){hoca=t;continue}
   if(!hoca&&!yer&&/^\p{Ll}/u.test(t)){ad.push(t);continue}
   if(!hoca&&t.split(' ').length>=2&&t.split(' ').length<=5&&/^\p{Lu}/u.test(t)&&ad.length){hoca=t;continue}
   if(!yer){yer=t;continue}if(!hoca&&yer.length+t.length<=60&&t.length<=30){yer+=' '+t;continue}continue}
  ad.push(t)}
 if(ad.length&&!yer){const m=ad[ad.length-1].match(TR);if(m&&ad[ad.length-1].length>m[0].length+2){yer=m[1];ad[ad.length-1]=ad[ad.length-1].slice(0,-m[0].length)}}
 return{kod,ad:ad.join(' ').replace(/\s+/g,' ').replace(/^[-–—:]\s*/,'').trim(),yer,hoca,kr}}
const nice=a=>a&&a===a.toLocaleUpperCase('tr')&&/[A-ZÇĞİÖŞÜ]{3,}/.test(a)?a.split(' ').map(w=>/^[IVX]+$/.test(w)?w:w.charAt(0)+w.slice(1).toLocaleLowerCase('tr')).join(' '):a;
const NOISE=/^(öğle|ogle|break|ara\b|teneffüs|yemek)/i;
function reg(out,c){if(!c.kod&&(!c.ad||NOISE.test(c.ad)))return null;const k=c.kod||trl(c.ad);let r=out.find(x=>x.k===k);if(!r){r={k,kod:c.kod,ad:nice(c.ad),kredi:0,hoca:'',m:[]};out.push(r)}if(!r.ad&&c.ad)r.ad=nice(c.ad);if(c.hoca&&!r.hoca)r.hoca=nice(c.hoca);return r}
function gridParse(items,hdr,out,bord){
 const cs=hdr.cols.map(c=>({g:c.g,xc:(c.x0+c.x1)/2})).sort((a,b)=>a.xc-b.xc);
 const bd=cs.map((c,i)=>i?(cs[i-1].xc+c.xc)/2:c.xc-(cs[1].xc-c.xc)/2);
 const colOf=x=>{let k=-1;for(let i=0;i<cs.length;i++)if(x>=bd[i])k=i;return k};
 const body=items.filter(i=>i.y>hdr.y+hdr.h*.6),tl=[],cells=cs.map(()=>[]);
 body.forEach(i=>{const k=colOf(i.x+i.w/2);if(k<0)tl.push(i);else cells[k].push(i)});
 let lab=[];clus(tl).forEach(l=>{const tx=l.it.map(i=>i.t).join(' ');if(!/^[\d:.\s\-–—]+$/.test(tx))return;const t=tms(tx);if(t.length)lab.push({y:l.y,h:l.h,a:t[0],b:t[1]||null})});
 if(lab.length>=4&&lab.length%2===0&&lab.every(x=>!x.b)){const md=a=>[...a].sort((p,q)=>p-q)[a.length>>1],g1=[],g2=[];lab.forEach((x,i)=>{if(i<lab.length-1)(i%2?g2:g1).push(lab[i+1].y-x.y)});
  if(md(g1)<.55*md(g2)){const n=[];for(let i=0;i<lab.length;i+=2)n.push({y:(lab[i].y+lab[i+1].y)/2,h:lab[i].h,a:lab[i].a,b:lab[i+1].a});lab=n}}
 let maxY=1e9;if(lab.length>1){const g=[];lab.forEach((x,i)=>{if(i)g.push(x.y-lab[i-1].y)});maxY=lab[lab.length-1].y+.9*[...g].sort((p,q)=>p-q)[g.length>>1]}
 const lc=x=>x.y-x.h/2,near=y=>{let b=-1,d=1e9;lab.forEach((x,i)=>{if(Math.abs(lc(x)-y)<d){d=Math.abs(lc(x)-y);b=i}});return b};
 cs.forEach((c,ci)=>{const bl=[],B=bord?bord(bd[ci],ci+1<cs.length?bd[ci+1]:bd[ci]+(bd[ci]-bd[ci-1])):null;
  clus(cells[ci].filter(i=>i.y<=maxY)).forEach(l=>{const tx=l.it.map(i=>i.t).join(' '),b=bl[bl.length-1],nc=CODE.test(tx);
   if(b&&l.y-b.y1<=1.9*Math.max(l.h,b.h)&&!(nc&&b.code)){b.tx.push(tx);b.y1=l.y;b.h=Math.max(b.h,l.h)}else bl.push({y0:l.y,y1:l.y,h:l.h,tx:[tx],code:nc})});
  bl.forEach(b=>{const k=cell(b.tx),r=reg(out,k);if(!r)return;if(k.kr&&!r.kredi)r.kredi=k.kr;let s='',e='';
   if(lab.length){let rows=[];
    if(B&&B.length){const c0=b.y0-b.h/2,c1=b.y1-b.h/2,tp=Math.max(-1e9,...B.filter(v=>v<=c0)),bt=Math.min(1e9,...B.filter(v=>v>=c1));
     if(tp>-1e9&&bt<1e9)lab.forEach((x,i)=>{if(lc(x)>tp&&lc(x)<bt)rows.push(i)})}
    if(!rows.length){const i0=near(b.y0-b.h/2);rows=[i0,Math.max(i0,near(b.y1-b.h/2))]}
    const f=lab[rows[0]],z=lab[rows[rows.length-1]],zi=rows[rows.length-1];s=f.a;e=z.b||(lab[zi+1]?lab[zi+1].a:'')}
   r.m.push({g:c.g,s,e,yer:k.yer})})})}
function listParse(L,st,out){
 for(const l of L){const sg=segs(l),full=sg.map(s=>s.t).join(' '),low=trl(full);
  if(/ders kodu|ders ad/.test(low)||(/\bgün\b/.test(low)&&/saat/.test(low))){if(/akts|kredi/.test(low))st.k=1;continue}
  const ti=tms(full);let g=-1;for(const s of sg){const d=s.t.split(' ').map(dayOf).find(x=>x>=0);if(d!==undefined){g=d;break}}
  if(g>=0&&!ti.length&&sg.length<=2){st.day=g;continue}
  const clean=sg.map(s=>s.t.split(' ').filter(w=>dayOf(w)<0&&!/^\d{1,2}[:.]\d{2}([-–—]\d{1,2}[:.]\d{2})?$/.test(w)&&!/^[-–—]+$/.test(w)).join(' ').trim()).filter(Boolean);
  let kr=0;const rest=clean.filter(t=>{if(st.k&&/^\d{1,2}$/.test(t)&&+t>=1&&+t<=30&&!kr){kr=+t;return false}return true});
  if(ti.length){const d=g>=0?g:st.day;if(d<0)continue;const c=cell(rest);let r=(c.ad||c.kod)?reg(out,c):st.cur;if(!r)continue;if(kr&&!r.kredi)r.kredi=kr;
   r.m.push({g:d,s:ti[0],e:ti[1]||'',yer:c.yer});st.cur=r}
  else if(rest.length){const c=cell(rest);if(c.kod&&c.ad){const r=reg(out,c);if(r){if(kr&&!r.kredi)r.kredi=kr;st.cur=r}}else if(c.hoca&&st.cur&&!st.cur.hoca)st.cur.hoca=c.hoca}}}
function parseProgram(pages,bs){const out=[],st={day:-1,cur:null,k:0};
 pages.forEach((items,pi)=>{const L=clus(items),h=findHdr(L);if(h)gridParse(items,h,out,bs&&bs[pi]);else listParse(L,st,out)});
 out.forEach(r=>{r.m.sort((a,b)=>a.g-b.g||a.s.localeCompare(b.s));const o=[];r.m.forEach(x=>{const p=o[o.length-1];if(p&&p.g===x.g&&p.s===x.s)return;if(p&&p.g===x.g&&p.e&&x.s&&tmin(x.s)-tmin(p.e)<=10){if(x.e&&x.e>p.e)p.e=x.e}else o.push({...x})});r.m=o});
 return out.filter(r=>r.ad||r.kod).map(r=>({...r,ad:r.ad||r.kod})).sort((a,b)=>(a.m[0]?a.m[0].g*2400+ +(a.m[0].s||'0').replace(':',''):9e9)-(b.m[0]?b.m[0].g*2400+ +(b.m[0].s||'0').replace(':',''):9e9))}
const tmin=t=>+t.slice(0,2)*60+ +t.slice(3,5);
const progTxt=m=>m.map(x=>`${PGN[x.g]}${x.s?' '+x.s+(x.e?'-'+x.e:''):''}${x.yer?' '+x.yer:''}`).join('\n');
function meets(r){const t=(r.progtxt||'').trim();
 if(t){const o=[];t.split('\n').forEach(l=>{const m=l.trim().match(/^(\S+)\s*(\d{1,2}[:.]\d{2})?(?:\s*[-–—]\s*(\d{1,2}[:.]\d{2}))?\s*(.*)$/);if(!m)return;const g=dayOf(m[1]);if(g<0)return;o.push({gun:PGN[g],s:m[2]?tms(m[2])[0]:'',e:m[3]?tms(m[3])[0]:'',yer:(m[4]||'').trim()})});return o}
 return r.gun?[{gun:r.gun,s:r.saat||'',e:'',yer:r.yer||''}]:[]}

let PDFJS=null,PGL=[];
async function pdfLib(){if(PDFJS)return PDFJS;const B='https://cdn.jsdelivr.net/npm/pdfjs-dist@5.6.205/legacy/build/',m=await import(B+'pdf.min.mjs');
 try{const w=await import(B+'pdf.worker.min.mjs');globalThis.pdfjsWorker={WorkerMessageHandler:w.WorkerMessageHandler}}catch(x){}
 m.GlobalWorkerOptions.workerSrc=B+'pdf.worker.min.mjs';PDFJS=m;return m}
function pdfAc(){dlg(`<h3>📄 Ders programını PDF'den yükle</h3><p class="m">Ders programı PDF'ini seç. İçindeki dersleri, günleri ve saatleri okuyup sana göstereyim, onayladıklarını ekleyeyim. PDF cihazından dışarı çıkmaz; okuyucu kütüphane ilk kullanımda internetten bir kez indirilir.</p><label class="ph2">📄 PDF seç<input type="file" accept="application/pdf,.pdf" hidden onchange="pdfOku(this.files[0])"></label><div id="pst" class="m"></div><div class="row"><button onclick="dlg()">Vazgeç</button></div>`)}
async function pdfBord(pg){const sc=2,v=pg.getViewport({scale:sc}),cv=document.createElement('canvas');cv.width=Math.ceil(v.width);cv.height=Math.ceil(v.height);const cx=cv.getContext('2d',{willReadFrequently:true});cx.fillStyle='#fff';cx.fillRect(0,0,cv.width,cv.height);
 await pg.render({canvasContext:cx,viewport:v}).promise;const d=cx.getImageData(0,0,cv.width,cv.height).data,W=cv.width,H=cv.height;
 return(x0,x1)=>{const X0=Math.round(x0*sc)+3,X1=Math.round(x1*sc)-3,o=[];if(X1<=X0)return o;let run=null;
  for(let y=0;y<H;y++){let c=0;for(let x=X0;x<X1;x++){const i=(y*W+x)*4;if(d[i]+d[i+1]+d[i+2]<645)c++}
   if(c>=.85*(X1-X0)){if(!run)run=[y,y];else run[1]=y}else if(run){o.push((run[0]+run[1])/2/sc);run=null}}
  if(run)o.push((run[0]+run[1])/2/sc);return o}}
async function pdfOku(f){if(!f)return;const st=$('pst'),say=t=>{if(st)st.textContent=t};say('PDF okunuyor…');
 let lib;try{lib=await pdfLib()}catch(x){return say('PDF okuyucu indirilemedi. İnternet bağlantını kontrol edip tekrar dene.')}
 try{const doc=await lib.getDocument({data:new Uint8Array(await f.arrayBuffer()),verbosity:0}).promise,pages=[],bs=[];
  for(let n=1;n<=doc.numPages;n++){const pg=await doc.getPage(n),vp=pg.getViewport({scale:1}),tc=await pg.getTextContent();pages.push(tc.items.filter(i=>i.str&&i.str.trim()).map(i=>({t:i.str.trim(),x:i.transform[4],y:vp.height-i.transform[5],w:i.width,h:i.height||Math.abs(i.transform[3])||9})));let bf=null;try{bf=await pdfBord(pg)}catch(x){}bs.push(bf)}
  if(!pages.some(p=>p.length))return say('Bu PDF’te okunabilir yazı yok (taranmış resim olabilir). Yazısı seçilebilen bir PDF dene ya da dersleri elle ekle.');
  const r=parseProgram(pages,bs);if(!r.length)return say('PDF okundu ama ders bulamadım. Tablo düzeni farklı olabilir; PDF’i bana gönderirsen okuyucuyu ona göre ayarlarım.');
  pdfOnay(r)}catch(x){say('PDF okunamadı: '+(x.message||x))}}
async function pdfOnay(r){PGL=r;const ex=(await recs(W.id,'ders')).map(x=>trl(x.ad||''));
 dlg(`<h3>📄 Bulunan dersler (${r.length})</h3><p class="m">Yanlış okunanı düzelt, eklemek istemediğin dersin işaretini kaldır.</p><div style="max-height:58vh;overflow:auto">${r.map((c,i)=>{const v=ex.includes(trl(c.ad));return `<div class="card" style="padding:10px;margin:8px 0"><label class="chk" style="margin:0"><input type="checkbox" id="pc${i}" ${v?'':'checked'}> <b>${e(c.ad)}</b>${v?' <span class="m">(zaten var — işaretlersen saatleri güncellenir)</span>':''}</label><label>Ders adı<input id="pa${i}" value="${e(c.ad)}"></label><div style="display:grid;grid-template-columns:90px 1fr;gap:8px"><label>AKTS *<input id="pk${i}" type="number" inputmode="decimal" min="1" placeholder="zorunlu" oninput="this.style.borderColor=''" value="${c.kredi||''}"></label><label>Öğretim üyesi<input id="ph${i}" value="${e(c.hoca||'')}"></label></div><label>Ders saatleri (satır başına: Gün 09:00-10:50 Sınıf)<textarea id="pp${i}" style="min-height:64px">${e(progTxt(c.m))}</textarea></label></div>`}).join('')}</div><div class="row"><button onclick="dlg()">Vazgeç</button><button class="p" onclick="pdfEkle()">Seçilenleri ekle</button></div>`)}
async function pdfEkle(){const all=await recs(W.id,'ders');let n=0,u=0,bad=null,nb=0;
 for(let i=0;i<PGL.length;i++){if(!$('pc'+i)?.checked)continue;const ad=$('pa'+i).value.trim();if(!ad)continue;const k=$('pk'+i),o=all.find(x=>trl(x.ad||'')===trl(ad));
  if(!(+k.value>0)&&!(o&&+o.kredi>0)){k.style.borderColor='#d33';nb++;if(!bad)bad=k}}
 if(bad){bad.scrollIntoView({block:'center'});bad.focus();toast(`AKTS zorunlu: ${nb} dersin AKTS'sini yaz ya da dersin işaretini kaldır ⚠️`);return}
 for(let i=0;i<PGL.length;i++){if(!$('pc'+i)?.checked)continue;const ad=$('pa'+i).value.trim();if(!ad)continue;const pt=$('pp'+i).value.trim(),m=meets({progtxt:pt})[0]||{},kr=$('pk'+i).value,ho=$('ph'+i).value.trim(),old=all.find(x=>trl(x.ad||'')===trl(ad));
  if(old){await put('rec',{...old,progtxt:pt,gun:m.gun||old.gun||'',saat:m.s||old.saat||'',yer:m.yer||old.yer||'',kredi:old.kredi||kr,hoca:old.hoca||ho});u++}
  else{await put('rec',{id:uid(),ws:W.id,type:'ders',ad,kredi:kr,hoca:ho,gun:m.gun||'',saat:m.s||'',yer:m.yer||'',progtxt:pt});n++}}
 dlg();toast(`${n} ders eklendi${u?`, ${u} ders güncellendi`:''} ✅`);render()}
