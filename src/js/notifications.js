/* Çalışma Alanım — canlı bildirim merkezi ve Web Push */
(()=>{
 const $id=id=>document.getElementById(id);
 let reg=null,uid=null,stopLive=null,scanTimer=null,lastScan=0,items=[];
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const storeKey=()=> 'ca_notifications_'+uid;
 const adminStoreKey=()=> 'ca_admin_notifications_'+uid;
 const adminItems=()=>{try{return JSON.parse(localStorage.getItem(adminStoreKey())||'[]')}catch{return []}};
 const saveAdminItems=a=>{try{localStorage.setItem(adminStoreKey(),JSON.stringify(a.slice(0,100)))}catch{};renderBadge()};
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
  const n=localItems().filter(x=>!x.read).length+adminItems().filter(x=>!x.read).length;b.textContent=n>99?'99+':String(n);b.hidden=!n;
 }
 function ensureButton(){
  if($id('ca-notif-button'))return;
  const b=document.createElement('button');b.id='ca-notif-button';b.type='button';b.setAttribute('aria-label','Bildirim merkezi');
  b.innerHTML='<span aria-hidden="true">🔔</span><i id="ca-notif-count" hidden></i>';
  b.addEventListener('click',openCenter);document.body.appendChild(b);renderBadge();
 }
 function openCenter(){
  const panel=document.createElement('div');panel.className='ca-notif-backdrop';panel.id='ca-notif-backdrop';
  const isAdmin=String(FB?.auth?.currentUser?.email||'').toLowerCase()==='ebsyonyol48@gmail.com';
  let activeTab='notifications';
  panel.innerHTML='<section class="ca-notif-panel" role="dialog" aria-modal="true" aria-labelledby="ca-notif-title"><header><div><small>BİLDİRİM MERKEZİ</small><h2 id="ca-notif-title">Bildirimlerin</h2></div><button class="ca-notif-close" aria-label="Kapat">×</button></header><nav class="ca-notif-tabs" role="tablist"><button type="button" role="tab" data-tab="notifications" aria-selected="true">Bildirimler</button><button type="button" role="tab" data-tab="for-you" aria-selected="false">Senin için</button></nav><div class="ca-notif-actions"><button data-action="enable">🔔 Bildirimleri etkinleştir</button>'+(isAdmin?'<button data-action="test">Test bildirimi gönder</button>':'')+'<button data-action="clear">Okundu işaretle</button></div><div class="ca-notif-list" id="ca-notif-content"></div><footer id="ca-notif-status">Bildirim tercihlerin burada.</footer></section>';
  document.body.appendChild(panel);
  const close=()=>panel.remove();panel.querySelector('.ca-notif-close').onclick=close;panel.addEventListener('click',e=>{if(e.target===panel)close()});
  const renderTab=()=>{
   const isForYou=activeTab==='for-you',list=isForYou?adminItems():localItems();
   panel.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab===activeTab)));
   panel.querySelector('#ca-notif-content').innerHTML=list.length?list.map(x=>'<article class="'+(x.read?'read':'')+'"><span>'+(isForYou?'✦':'◈')+'</span><div><b>'+esc(x.title)+'</b><p>'+esc(x.body)+'</p><small>'+new Date(x.at).toLocaleString('tr-TR')+'</small></div></article>').join(''):'<div class="ca-notif-empty">'+(isForYou?'Senin için henüz yeni bir içerik yok.':'Henüz bildirimin yok.')+'<small>'+(isForYou?'Sana özel bildirimler burada görünecek.':'Hatırlatmalar ve hesap etkinlikleri burada görünecek.')+'</small></div>';
  };
  panel.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{activeTab=b.dataset.tab;renderTab()});
  renderTab();
  panel.querySelector('[data-action="enable"]').onclick=async()=>{try{await enablePush();status('Bildirimler etkinleştirildi. Bu cihaz bildirim alabilir.')}catch(e){status(e.message)}};
  const testButton=panel.querySelector('[data-action="test"]');if(testButton)testButton.onclick=async()=>{try{await sendPush('Çalışma Alanım hazır!','Canlı bildirim bağlantın çalışıyor.');status('Test bildirimi gönderildi.')}catch(e){status(e.message)}};
  panel.querySelector('[data-action="clear"]').onclick=()=>{if(activeTab==='for-you')saveAdminItems(adminItems().map(x=>({...x,read:true})));else saveItems(localItems().map(x=>({...x,read:true})));renderTab()};
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
  // Yönetim panelinin cihazları bulabilmesi için aboneliği önce sunucuya kaydet.
  const token=await u.getIdToken();
  const saved=await fetch('/api/admin/register-subscription',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+token},body:JSON.stringify({subscription:sub.toJSON()})});
  const savedData=await saved.json().catch(()=>({}));
  if(!saved.ok||!savedData.saved)throw new Error(savedData.error||'Cihaz aboneliği sunucuya kaydedilemedi. Tekrar deneyebilirsin.');
  localStorage.setItem('ca_push_enabled_'+u.uid,'1');
  add('Bildirimler açıldı','Bu cihaz bildirim almak üzere kaydedildi.','Sistem');
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
 let promptUid=null;
 function showEnablePrompt(user){
  if(!user||user.uid!==uid||!('Notification'in window)||Notification.permission!=='default'||localStorage.getItem('ca_push_enabled_'+user.uid)==='1')return;
  if(sessionStorage.getItem('ca_push_prompt_'+user.uid)||$id('ca-push-optin'))return;
  sessionStorage.setItem('ca_push_prompt_'+user.uid,'1');
  const box=document.createElement('aside');box.id='ca-push-optin';box.className='ca-push-optin';
  box.innerHTML='<button type="button" class="ca-push-optin-close" aria-label="Kapat">×</button><div class="ca-push-optin-icon">🔔</div><div class="ca-push-optin-copy"><b>Bildirimleri aç</b><p>Görevlerini, sınavlarını ve önemli duyuruları zamanında haber verelim.</p></div><button type="button" class="ca-push-optin-enable">Etkinleştir</button>';
  document.body.appendChild(box);
  box.querySelector('.ca-push-optin-close').onclick=()=>box.remove();
  box.querySelector('.ca-push-optin-enable').onclick=async e=>{const b=e.currentTarget;b.disabled=true;b.textContent='Açılıyor…';try{await enablePush();box.remove()}catch(err){const p=box.querySelector('p');p.textContent=err.message;b.disabled=false;b.textContent='Tekrar dene'}};
 }
 function listen(){
  if(!FB?.auth?.currentUser||uid===FB.auth.currentUser.uid)return;
  if(stopLive)stopLive();uid=FB.auth.currentUser.uid;items=localItems();renderBadge();
  const f=FB,u=f.auth.currentUser;
  try{
   const col=f.fs.collection(f.db,'users',u.uid,'notifications');
   stopLive=f.fs.onSnapshot(col,snap=>snap.docChanges().forEach(ch=>{
    if(ch.type!=='added')return;const d=ch.doc.data();if(!d.createdAt)return;
    const at=Number(d.createdAt);if(!Number.isFinite(at)||Date.now()-at>30*86400000)return;
    if(d.source==='admin'||d.type==='Duyuru'){
     const existing=adminItems();if(existing.some(x=>x.id===ch.doc.id))return;
     saveAdminItems([{id:ch.doc.id,title:d.title||'Yönetici duyurusu',body:d.body||'',type:'Duyuru',at,read:false},...existing]);
    }else add(d.title||'Yeni bildirim',d.body||'',d.type||'Bilgi');
    if($id('ca-notif-backdrop')){const tab=$id('ca-notif-backdrop').querySelector('[aria-selected="true"]')?.dataset.tab;if(tab==='for-you')$id('ca-notif-content').innerHTML='';}
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
  }else if(typeof Notification!=='undefined'&&Notification.permission==='granted'&&reg){
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
  if(!u){if(stopLive)stopLive();stopLive=null;uid=null;promptUid=null;clearInterval(scanTimer);$id('ca-push-optin')?.remove();return}
  listen();
  if(promptUid!==u.uid){promptUid=u.uid;setTimeout(()=>showEnablePrompt(u),1800)}
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