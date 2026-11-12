const $=i=>document.getElementById(i),uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const e=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let db,W=null,cur={m:null,t:null,wk:mon(new Date())},WZ={},CF=null;
function mon(d){d=new Date(d);d.setDate(d.getDate()-(d.getDay()+6)%7);d.setHours(0,0,0,0);return d}
const iso=d=>{d=new Date(d);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
/* ---- IndexedDB ---- */
const openDB=()=>new Promise((a,b)=>{let settled=false;const finish=(fn,v)=>{if(settled)return;settled=true;clearTimeout(timer);fn(v)};window.__startupStage='IndexedDB bağlantısı açılıyor';let r;try{if(!('indexedDB'in window))throw new Error('Bu tarayıcı IndexedDB desteği sunmuyor');r=indexedDB.open('calisma-alani',1)}catch(x){finish(b,x);return}const timer=setTimeout(()=>finish(b,new Error('IndexedDB isteği 8 saniyede yanıt vermedi. Başka bir sekme veritabanını kilitlemiş olabilir.')),8000);r.onupgradeneeded=()=>{try{const d=r.result;if(!d.objectStoreNames.contains('ws'))d.createObjectStore('ws',{keyPath:'id'});if(!d.objectStoreNames.contains('rec'))d.createObjectStore('rec',{keyPath:'id'}).createIndex('ws','ws');if(!d.objectStoreNames.contains('meta'))d.createObjectStore('meta',{keyPath:'k'})}catch(x){finish(b,x)}};r.onblocked=()=>finish(b,new Error('IndexedDB yükseltmesi engellendi. Aynı siteyi açık tutan diğer sekmeleri kapatıp yeniden yükleyin.'));r.onsuccess=()=>{r.result.onversionchange=()=>r.result.close();finish(a,r.result)};r.onerror=()=>finish(b,r.error||new Error('IndexedDB açılamadı'))});
const P=r=>new Promise((a,b)=>{r.onsuccess=()=>a(r.result);r.onerror=()=>b(r.error)});
const tx=(s,m='readonly')=>db.transaction(s,m).objectStore(s);
const all=s=>P(tx(s).getAll()),put=(s,v)=>{fbDirty(s,s==='meta'?v.k:v.id,'put');return P(tx(s,'readwrite').put(v))},del=(s,k)=>{fbDirty(s,k,'del');return P(tx(s,'readwrite').delete(k))};
const recs=async(ws,t)=>(await P(tx('rec').index('ws').getAll(ws))).filter(r=>!t||r.type===t);
/* ---- Tanımlar ---- */
const ST='sel:Bekliyor,Devam ediyor,Tamamlandı,İptal edildi';
const T={
gorev:{n:'Görev',f:[['ad','Görev'],['son','Son tarih','date'],['saat','Saat','time'],['oncelik','Öncelik','sel:Düşük,Orta,Yüksek'],['durum','Durum',ST],['tekrar','Tekrar (bitince otomatik yenilenir)','sel:Her gün,Her hafta,Her ay'],['not','Not','area']]},
kart:{n:'Bilgi kartı',t:r=>(r.on||'').slice(0,60),f:[['on','Soru / ön yüz','area'],['ders','Ders','ref:ders'],['konu','Konu'],['arka','Cevap / arka yüz','area']]},
ders:{n:'Ders',f:[['ad','Ders'],['kredi','AKTS','number'],['hoca','Öğretim üyesi'],['gun','Gün','sel:Pazartesi,Salı,Çarşamba,Perşembe,Cuma,Cumartesi,Pazar'],['saat','Saat','time'],['yer','Sınıf'],['progtxt','Tüm ders saatleri (satır başına: Gün 09:00-10:50 Sınıf) — doluysa yukarıdaki gün/saat yerine bu kullanılır','area'],['dev','Devamsızlık (ders saati)','number'],['hak','Devamsızlık hakkı (ders saati)','number']]},
odev:{n:'Ödev',f:[['ad','Ödev'],['ders','Ders','ref:ders'],['son','Son tarih','date'],['saat','Saat','time'],['durum','Durum',ST]]},
sinav:{n:'Sınav',f:[['ad','Sınav'],['ders','Ders','ref:ders'],['tarih','Tarih','date'],['saat','Saat','time'],['yer','Yer']]},
takvim:{n:'Etkinlik',f:[['ad','Etkinlik'],['tarih','Tarih','date'],['saat','Saat','time'],['not','Not','area']]},
not:{n:'Not',f:[['ad','Başlık'],['not','İçerik','area']]},
finans:{n:'Finans işlemi',f:[['ad','Açıklama'],['tur','Tür','sel:Gelir,Gider'],['tutar','Tutar','number'],['tarih','Tarih','date'],['kategori','Kategori','sel:Market,Ulaşım,Eğitim,Fatura,Sağlık,Eğlence,Alışveriş,Maaş,Burs,Ek gelir,Diğer'],['not','Not','area']]},
};
const M={gorev:['✅','Görevler'],takvim:['📅','Takvim',['ay','takvim']],finans:['💰','Finans'],odak:['⏱️','Odak Sayacı'],kart:['🃏','Bilgi Kartları',['kart','calis']],ders:['🎓','Dersler',['ders','program','hesap']],uni:['🏛️','Üniversite'],odev:['📚','Ödevler'],sinav:['🧪','Sınavlar'],not:['📓','Notlar']};
const AV={ogr:['ders','uni','odak','odev','sinav','gorev','takvim','not','finans']};
const DEF={ogr:AV.ogr};
const TL={program:'Haftalık program',hesap:'📈 Not hesabı',ders:'Ders listesi',kart:'Kartlar',calis:'Çalış',ay:'Ay görünümü',takvim:'Etkinlikler'};
const ttl=(t,r)=>T[t].t?T[t].t(r):r[T[t].f[0][0]]||'';
const sub=(t,r)=>[...T[t].f.slice(1).filter(x=>x[2]!=='area'&&r[x[0]]).slice(0,3),...(W.extra?.[t]||[]).filter(x=>r[x[0]])].map(x=>r[x[0]]).join(' · ');
/* ---- Başlangıç ---- */
async function init(){
 try{
  window.__startupStage='Yerel veritabanı açılıyor';
  db=await openDB();
  window.__startupStage='Depolama izni kontrol ediliyor';
  try{await navigator.storage?.persist?.()}catch(storageError){}
  window.__startupStage='Görünüm ayarları okunuyor';
  const th=await P(tx('meta').get('theme'));
  if(th?.v)document.documentElement.dataset.theme=th.v;
  window.__startupStage='Güvenlik ayarları okunuyor';
  const pn=await P(tx('meta').get('pin'));
  if(pn){lock(pn.v);window.appLocalReadyDone?.();return}
  window.__startupStage='Çalışma alanı hazırlanıyor';
  await boot();
  window.__startupStage='Hazır';
  window.appLocalReadyDone?.();
 }catch(x){
  window.__startupStage='Hata: '+String(x?.message||x);
  console.error('Uygulama başlatılamadı:',x);
  const loader=$('startup-loader');
  if(loader){
   loader.setAttribute('role','alert');
   loader.setAttribute('aria-label','Uygulama başlatılamadı');
   loader.classList.add('startup-error');
   loader.innerHTML='<div class="startup-error-card"><span class="startup-error-mark">!</span><h1>Çalışma alanı açılamadı</h1><p>Bu cihazın yerel depolamasına erişemedim. Tarayıcı depolama iznini kontrol edip yeniden deneyebilirsin. Kayıtların silinmedi.</p><button type="button" onclick="location.reload()">Yeniden dene</button></div>';
  }
 }
}
async function boot(){const L=await all('ws');for(const x of L)if(!x.u1){x.u1=1;if(!x.mods.includes('uni'))x.mods.splice(Math.min(1,x.mods.length),0,'uni');await put('ws',x)}if(!(await P(tx('meta').get('mig2')))){for(const r of await all('rec'))if(r.type==='hatirlatma')await put('rec',{...r,type:'gorev'});await put('meta',{k:'mig2',v:1})}if(!(await P(tx('meta').get('mig3')))){for(const r of await all('rec'))if(r.type==='dnot')await put('rec',{...r,type:'not',ad:r.konu||'Ders notu',ts:r.ts||parseInt(r.id.slice(0,-5),36)||Date.now()});await put('meta',{k:'mig3',v:1})}for(const x of L)if(x.mode!=='ogr'||!x.v2){x.mode='ogr';if(!x.v2){x.v2=1;x.mods=[...new Set([...x.mods,'kart','odak'])]}await put('ws',x)}if(!L.length){$('app').innerHTML='';return}const m=await P(tx('meta').get('last'));W=L.find(x=>x.id===m?.v)||L[0];render()}
function wz(){$('app').innerHTML=`<div class="wz"><h1>Çalışma alanınıza ad verin.</h1><p class="m">Verileriniz yalnızca bu cihazdaki yerel veritabanında (IndexedDB) saklanır. Hesap ve internet gerekmez.</p><label>Çalışma alanı adı<input id="wn" placeholder="Üniversite"></label><div class="row"><button class="p" onclick="mk()">Oluştur</button></div></div>`}
async function mk(){const nm=($('wn')?.value||'').trim()||'Üniversite';W={id:uid(),name:nm,mode:'ogr',mods:[...AV.ogr],v2:1};await put('ws',W);await put('meta',{k:'last',v:W.id});WZ={};cur.m=null;render()}

