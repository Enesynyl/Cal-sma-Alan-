/* Çalışma Alanım — canlı bildirim merkezi ve Web Push */
(()=>{
 const $id=id=>document.getElementById(id);
 let reg=null,uid=null,stopLive=null,scanTimer=null,lastScan=0,items=[];
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const storeKey=()=> 'ca_notifications_'+uid;
 const localItems=()=>{try{return JSON.parse(localStorage.getItem(storeKey())||'[]')}catch{return []}};
 const saveItems=a=>{items=a.slice(0,80);try{localStorage.setItem(storeKey(),JSON.stringify(items))}catch{};renderBadge()};
 function add(title,body,type='Bilgi'){
  const row={id:Date.now()+'_'+Math.random().toString(36).slice(2,7),title,body,type,at:Date.now(),read:false};
  saveItems([row,...localItems()]);
  if(document.visibilityState==='visible')return;
  if(Notification.permission==='granted')reg?.showNotification(title,{body,icon:'/logo.svg',badge:'/logo.svg',tag:row.id,data:{url:'/'},renotify:false});
 }
 function renderBadge(){
  const b=$id('ca-notif-count');if(!b)return;
  const n=localItems().filter(x=>!x.read).length;b.textContent=n>99?'99+':String(n);b.hidden=!n;
 }
 function ensureButton(){
  if($id('ca-notif-button'))return;
  const b=document.createElement('button');b.id='ca-notif-button';b.type='button';b.setAttribute('aria-label','Bildirim merkezi');
  b.innerHTML='<span aria-hidden="true">🔔</span><i id="ca-notif-count" hidden></i>';
  b.addEventListener('click',openCenter);document.body.appendChild(b);renderBadge();
 }
 function openCenter(){
  const list=localItems();
  const panel=document.createElement('div');panel.className='ca-notif-backdrop';panel.id='ca-notif-backdrop';
  panel.innerHTML='<section class="ca-notif-panel" role="dialog" aria-modal="true" aria-labelledby="ca-notif-title"><header><div><small>BİLDİRİM MERKEZİ</small><h2 id="ca-notif-title">Bildirimlerin</h2></div><button class="ca-notif-close" aria-label="Kapat">×</button></header><div class="ca-notif-actions"><button data-action="enable">🔔 Bildirimleri etkinleştir</button><button data-action="test">Test bildirimi gönder</button><button data-action="clear">Tümünü okundu işaretle</button></div><div class="ca-notif-list">'+(list.length?list.map(x=>'<article class="'+(x.read?'read':'')+'"><span>✦</span><div><b>'+esc(x.title)+'</b><p>'+esc(x.body)+'</p><small>'+new Date(x.at).toLocaleString('tr-TR')+'</small></div></article>').join(''):'<div class="ca-notif-empty">Henüz bildirimin yok.<small>Hatırlatmalar ve hesap etkinlikleri burada görünecek.</small></div>')+'</div><footer id="ca-notif-status">Bildirim tercihlerini buradan yönetebilirsin.</footer></section>';
  document.body.appendChild(panel);
  const close=()=>panel.remove();panel.querySelector('.ca-notif-close').onclick=close;panel.addEventListener('click',e=>{if(e.target===panel)close()});
  panel.querySelector('[data-action="enable"]').onclick=async()=>{try{await enablePush();status('Bildirimler etkinleştirildi. Bu cihaz bildirim alabilir.')}catch(e){status(e.message)}};
  panel.querySelector('[data-action="test"]').onclick=async()=>{try{await sendPush('Çalışma Alanım hazır!','Canlı bildirim bağlantın çalışıyor.');status('Test bildirimi gönderildi.')}catch(e){status(e.message)}};
  panel.querySelector('[data-action="clear"]').onclick=()=>{saveItems(localItems().map(x=>({...x,read:true})));close();openCenter()};
  function status(t){const el=$id('ca-notif-status');if(el)el.textContent=t}
 }
 async function getUser(){const f=await fbLoad();const u=f.auth.currentUser;if(!u)throw new Error('Push bildirimleri için hesabına giriş yapmalısın.');return {f,u}}
 async function enablePush(){
  const isIOS=/iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
  if(isIOS&&!isStandalone)throw new Error('iPhone/iPad’de Web Push bildirimleri Safari sekmesinde çalışmaz. Önce Safari’de Paylaş → Ana Ekrana Ekle yoluyla Çalışma Alanım’ı ana ekrana ekle; ardından ana ekrandaki simgeden açıp Bildirimleri etkinleştir.');
  if(!window.isSecureContext)throw new Error('Bildirimler yalnızca HTTPS bağlantısında çalışır.');
  if(!('serviceWorker'in navigator)||!('PushManager'in window)||!('Notification'in window))throw new Error('Bu tarayıcı veya uygulama Web Push API desteği sunmuyor. Güncel Safari/Chrome kullan ve uygulamayı HTTPS üzerinden aç.');
  const {f,u}=await getUser();
  const permission=await Notification.requestPermission();if(permission!=='granted')throw new Error('Bildirim izni verilmedi. Tarayıcı ayarlarından izin verebilirsin.');
  reg=reg||await navigator.serviceWorker.register('/sw.js');
  const cfgResponse=await fetch('/api/push/config',{cache:'no-store'});const cfg=await cfgResponse.json().catch(()=>({}));if(!cfgResponse.ok||!cfg.publicKey)throw new Error(cfg.error||'Push anahtarı sunucudan alınamadı. Sayfayı yenileyip tekrar dene.');
  const expectedKey=decodeKey(cfg.publicKey);
  let sub=await reg.pushManager.getSubscription();
  if(sub){
   const currentKey=sub.options?.applicationServerKey;
   const sameKey=currentKey&&currentKey.byteLength===expectedKey.byteLength&&Array.from(new Uint8Array(currentKey)).every((v,i)=>v===expectedKey[i]);
   if(!sameKey){await sub.unsubscribe();sub=null;}
  }
  if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:expectedKey});
  // Push delivery uses this device's active subscription directly.
  // No Firestore write is needed for enabling or testing browser notifications.
  localStorage.setItem('ca_push_enabled_'+u.uid,'1');
  add('Bildirimler açıldı','Bu cihaz Çalışma Alanım bildirimlerini alabilir.','Sistem');
  return true;
 }
 function decodeKey(s){const p='='.repeat((4-s.length%4)%4);const raw=atob((s+p).replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from(raw,c=>c.charCodeAt(0))}
 async function sendPush(title,body){
  let stage='oturum';const trace='push-'+Date.now().toString(36);
  try{
   const {f,u}=await getUser();stage='kimlik doğrulama';const token=await u.getIdToken();
   stage='cihaz aboneliği';
   if(!('serviceWorker' in navigator))throw new Error('Bu tarayıcı Service Worker desteği sunmuyor.');
   let registration=null;
   try{registration=await navigator.serviceWorker.getRegistration('/')}catch{}
   if(!registration)registration=await navigator.serviceWorker.ready;
   if(!registration)throw new Error('Aktif Service Worker kaydı bulunamadı. Uygulamayı kapatıp ana ekrandan yeniden aç.');
   if(!registration.pushManager||typeof registration.pushManager.getSubscription!=='function')throw new Error('Bu cihazdaki Service Worker PushManager API sunmuyor. iPhone’da uygulamayı Ana Ekrana Ekle ile açtığını ve iOS sürümünün Web Push desteklediğini kontrol et.');
   reg=registration;
   const activeSub=await registration.pushManager.getSubscription();
   if(!activeSub)throw new Error('Bu cihazda aktif Push aboneliği yok. Bildirimleri yeniden etkinleştir.');
   stage='sunucu isteği';
   const r=await fetch('/api/push/send?diag='+encodeURIComponent(trace),{method:'POST',cache:'no-store',headers:{'content-type':'application/json','cache-control':'no-cache','x-push-trace':trace,authorization:'Bearer '+token},body:JSON.stringify({title,body,subscription:activeSub.toJSON()})});
   stage='sunucu yanıtı';const raw=await r.text();let data={};try{data=JSON.parse(raw)}catch{}
   if(!r.ok)throw new Error('HTTP '+r.status+' — '+(data.error||raw.slice(0,220)||'Sunucu boş yanıt döndürdü.'));
   if(!data.sent)throw new Error('Sunucu isteği aldı ancak bildirim gönderildi onayı vermedi.');
   return data;
  }catch(e){
   console.error('[Push test]',{trace,stage,error:e?.message||String(e)});
   throw new Error('Bildirim testi başarısız ('+stage+'): '+(e?.message||String(e))+' ['+trace+']');
  }
 }
 function listen(){
  if(!FB?.auth?.currentUser||uid===FB.auth.currentUser.uid)return;
  if(stopLive)stopLive();uid=FB.auth.currentUser.uid;items=localItems();renderBadge();
  const f=FB,u=f.auth.currentUser;
  try{
   const col=f.fs.collection(f.db,'users',u.uid,'notifications');
   stopLive=f.fs.onSnapshot(col,snap=>snap.docChanges().forEach(ch=>{
    if(ch.type!=='added')return;const d=ch.doc.data();if(d.createdAt&&Date.now()-d.createdAt<86400000)add(d.title||'Yeni bildirim',d.body||'',d.type||'Bilgi');
   }));
  }catch(e){console.warn('Bildirim akışı açılamadı',e)}
  if(!reg&&'serviceWorker'in navigator)navigator.serviceWorker.register('/sw.js').then(x=>reg=x).catch(()=>{});
  scheduleReminders();
 }
 function notify(title,body,type='Hatırlatma',opts={}){
  add(title,body,type);
  const key=opts.key||('evt_'+uid+'_'+String(title)+'_'+String(body));
  try{const k='ca_evt_'+key;if(localStorage.getItem(k))return;localStorage.setItem(k,'1')}catch{}
  if(localStorage.getItem('ca_push_enabled_'+uid)==='1'){
   sendPush(title,body).catch(e=>console.warn('Canlı bildirim gönderilemedi:',e.message));
  }else if(Notification?.permission==='granted'&&reg){
   reg.showNotification(title,{body,icon:'/logo.svg',badge:'/logo.svg',tag:key,renotify:false,data:{url:opts.url||'/'}}).catch(()=>{});
  }
 }
 const seenStates=new Map();
 function scheduleReminders(){
  clearInterval(scanTimer);
  const scan=async()=>{
   if(!uid||!FB?.auth?.currentUser||!W?.id)return;
   const now=Date.now();if(now-lastScan<20000)return;lastScan=now;
   try{
    const rows=await recs(W.id);const thresholds=[['24s',86400000,'1 gün'],['1s',3600000,'1 saat'],['15d',900000,'15 dakika'],['now',0,'şimdi']];
    for(const r of rows){
     if(!['gorev','odev','sinav','takvim'].includes(r.type))continue;
     const date=r.son||r.tarih;if(!date)continue;
     if(['gorev','odev'].includes(r.type)&&['Tamamlandı','İptal edildi'].includes(r.durum))continue;
     const at=new Date(date+'T'+(r.saat||'23:59')+':00').getTime(),diff=at-now;
     const name=r.ad||r.on||'Etkinlik',label=r.type==='sinav'?'Sınav':r.type==='odev'?'Ödev':r.type==='takvim'?'Etkinlik':'Görev';
     for(const [code,ms,txt] of thresholds){
      const crossed=code==='now'?diff<=0&&diff>-60000:diff<=ms&&diff>ms-60000;
      if(crossed)notify(label+' hatırlatması',name+(code==='now'?' için zamanı geldi.':' için '+txt+' kaldı.'),'Hatırlatma',{key:r.id+'_'+date+'_'+code,url:'/'});
     }
     const stateKey=r.id+'_state',previous=seenStates.get(stateKey);
     if(previous&&previous!=='Tamamlandı'&&r.durum==='Tamamlandı')notify('Görev tamamlandı',name+' tamamlandı. Eline sağlık!','Görev',{key:r.id+'_completed_'+date});
     seenStates.set(stateKey,r.durum||'');
    }
    if(typeof yDers==='function'){
     const c=typeof dhc==='function'?dhc():{on:true,dk:30,aksam:true};
     if(c.on){const lessons=await yDers();for(const x of lessons){if(!x.tm||x.o>0)continue;const diff=x.st.getTime()-now;if(diff>0&&diff<=c.dk*60000&&diff>c.dk*60000-60000)notify('Dersin yaklaşıyor',x.r.ad+' '+Math.max(1,Math.round(diff/60000))+' dakika içinde başlayacak.','Ders',{key:'lesson_'+x.r.id+'_'+iso(x.st)+'_'+x.m.s})}}
    }
   }catch(e){console.warn('Hatırlatma taraması:',e)}
  };
  scan();scanTimer=setInterval(scan,30000);
 }
 function authChanged(u){
  if(!u){if(stopLive)stopLive();stopLive=null;uid=null;clearInterval(scanTimer);return}
  listen();
 }
 function boot(){
  ensureButton();
  if('serviceWorker'in navigator)navigator.serviceWorker.register('/sw.js').then(x=>reg=x).catch(e=>console.warn('Service worker:',e));
  setInterval(()=>{ensureButton();if(FB?.auth?.currentUser)authChanged(FB.auth.currentUser)},1500);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&FB?.auth?.currentUser)scheduleReminders()});
 }
 window.CANotifications={add,notify,enablePush,sendPush,openCenter};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();