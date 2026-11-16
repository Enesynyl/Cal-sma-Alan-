import webpush from 'web-push';
import {requireAdmin,firestoreList,fieldsToObject,json} from './_lib.js';
const PROJECT='calisma-alani-34ba7',PUBLIC='BK-0Z26P6-lQmXI8MKkRmCKlPvPQKS5bfqz9MZz_vjmzxwAKEM5JzzyBrFv5lsb8q9gxVdKPfh1at_cVjpdyusA';
const ROOT='https://firestore.googleapis.com/v1/projects/'+PROJECT+'/databases/(default)/documents';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
 try{
  const admin=await requireAdmin(req,res);if(!admin)return;
  const title=String(req.body?.title||'').trim().slice(0,90),body=String(req.body?.body||'').trim().slice(0,220),target=req.body?.target||'all',uids=Array.isArray(req.body?.uids)?req.body.uids.slice(0,100):[],imageUrl=String(req.body?.imageUrl||'').trim().slice(0,2000),imageData=String(req.body?.imageData||'').trim(),linkUrl=String(req.body?.linkUrl||'').trim().slice(0,2000);
  if(!title||!body)return json(res,400,{error:'Başlık ve mesaj zorunludur.'});
  if(linkUrl&&!/^https:\/\//i.test(linkUrl))return json(res,400,{error:'Bağlantı https:// ile başlamalı.'});
  if(imageData&&(!/^data:image\/(jpeg|webp|png);base64,[A-Za-z0-9+/=]+$/.test(imageData)||imageData.length>550000))return json(res,400,{error:'Sıkıştırılmış görsel geçersiz veya 380 KB sınırını aşıyor.'});
  const key=String(process.env.VAPID_PRIVATE_KEY||'').trim();if(key)webpush.setVapidDetails(String(process.env.VAPID_SUBJECT||'mailto:calismaalanim451@gmail.com'),PUBLIC,key);
  let users=[];
  if(target==='all'){
   let page='',count=0;do{const q=new URL('https://identitytoolkit.googleapis.com/v1/projects/'+PROJECT+'/accounts:batchGet');q.searchParams.set('maxResults','1000');if(page)q.searchParams.set('nextPageToken',page);const r=await fetch(q,{headers:{authorization:'Bearer '+admin.token}}),d=await r.json();if(!r.ok)throw new Error(d.error?.message||'AUTH_USERS_LIST_FAILED');users.push(...(d.users||[]).map(x=>x.localId));page=d.nextPageToken||'';count++}while(page&&count<10);
  }else users=uids;
  const now=Date.now(),active=[],writes=[],subs=[],announcementId=imageData?'ann_'+now+'_'+Math.random().toString(36).slice(2,10):'';
  if(imageData&&users.length){
   const imageDoc={update:{name:'projects/'+PROJECT+'/databases/(default)/documents/adminAnnouncements/'+announcementId,fields:{imageData:{stringValue:imageData},createdAt:{integerValue:String(now)},source:{stringValue:'admin'}}}};
   const saved=await fetch(ROOT+':commit',{method:'POST',headers:{authorization:'Bearer '+admin.token,'content-type':'application/json'},body:JSON.stringify({writes:[imageDoc]})});
   if(!saved.ok){const detail=await saved.text();return json(res,502,{error:'Duyuru görseli kaydedilemedi: '+detail.slice(0,350)})}
  }
  for(const uid of users){
   try{
    const [sessions,pushes]=await Promise.all([firestoreList(admin.token,'users/'+uid+'/activeDevices'),firestoreList(admin.token,'users/'+uid+'/pushSubscriptions')]);
    const live=new Map((sessions.documents||[]).map(doc=>({id:doc.name.split('/').pop(),...fieldsToObject(doc.fields||{})})).filter(x=>x.deviceId&&now-Number(x.updatedAt||0)<=120000&&now>=Number(x.updatedAt||0)).map(x=>[x.deviceId,x]));
    if(live.size)active.push({uid,devices:live.size});
    // Store one durable inbox item on the account, even when no device is online.
    // Push delivery uses every saved subscription, even if the user is not currently in the app.
    const id='admin_'+now+'_'+Math.random().toString(36).slice(2,8);
    writes.push({update:{name:'projects/'+PROJECT+'/databases/(default)/documents/users/'+uid+'/notifications/'+id,fields:{title:{stringValue:title},body:{stringValue:body},type:{stringValue:'Duyuru'},source:{stringValue:'admin'},createdAt:{integerValue:String(now)},...(imageUrl?{imageUrl:{stringValue:imageUrl}}:{}),...(announcementId?{announcementId:{stringValue:announcementId}}:{}),...(linkUrl?{linkUrl:{stringValue:linkUrl}}:{})}}});
    for(const doc of pushes.documents||[]){const s=fieldsToObject(doc.fields||{});if(s.endpoint&&s.p256dh&&s.auth)subs.push({uid,deviceId:s.deviceId||'',subscription:{endpoint:s.endpoint,keys:{p256dh:s.p256dh,auth:s.auth}},documentId:doc.name.split('/').pop()})}
   }catch(e){console.warn('active device lookup failed',uid,e.message)}
  }
  let inAppSaved=0;
  for(let i=0;i<writes.length;i+=400){
   const batch=await fetch(ROOT+':commit',{method:'POST',headers:{authorization:'Bearer '+admin.token,'content-type':'application/json'},body:JSON.stringify({writes:writes.slice(i,i+400)})});
   if(!batch.ok){const detail=await batch.text();console.error('device notification write failed',detail);return json(res,502,{error:'Aktif cihaz bildirimleri kaydedilemedi: '+detail.slice(0,500)})}
   inAppSaved+=Math.min(400,writes.length-i);
  }
  let sent=0,failed=0,pushWarning='';
  if(key&&subs.length){
   const payload=JSON.stringify({title,body,url:linkUrl||'/',image:imageUrl||undefined,tag:'admin-'+now});
   const results=await Promise.allSettled(subs.map(x=>webpush.sendNotification(x.subscription,payload)));
   sent=results.filter(x=>x.status==='fulfilled').length;failed=results.length-sent;
   // Expired or revoked browser subscriptions cannot receive future pushes; remove them.
   const expired=[];
   results.forEach((result,index)=>{if(result.status==='rejected'&&[404,410].includes(Number(result.reason?.statusCode)))expired.push(subs[index])});
   await Promise.allSettled(expired.map(async x=>{
    const endpointId=x.documentId;
    if(!endpointId)return;
    const url=ROOT+'/users/'+x.uid+'/pushSubscriptions/'+endpointId;
    await fetch(url,{method:'DELETE',headers:{authorization:'Bearer '+admin.token}});
   }));
  }else if(!key)pushWarning='Web Push anahtarı yapılandırılmamış; uygulama içi duyuru kaydedildi.';
  return json(res,200,{ok:true,users:users.length,activeDevices:active.reduce((n,x)=>n+x.devices,0),devices:subs.length,sent,failed,inAppSaved,pushWarning,note:'Duyuru hesap bildirim geçmişine kaydedildi; Web Push tüm kayıtlı ve geçerli cihaz aboneliklerine gönderildi. Aktif oturum bilgisi yalnızca raporlama içindir.'});
 }catch(e){console.error('admin notification error',e);return json(res,500,{error:String(e.message||e)})}
}
