import webpush from 'web-push';
const PROJECT='calisma-alani-34ba7';
const API_KEY='AIzaSyBQ3I3HgnLqrmfnPJCPiAfBj67CeifoxCI';
const VAPID_PUBLIC_KEY='BGw8rJ8J3cezaV6dyXUIdD128S2gV2huDljsuzz5df0WrIyx7IaZSM9C2zodN2OYMQp5oWm_l0xMF8V7C5GfA5U';
const SERVER_REVISION='push-runtime-diagnostic-20261114-01';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store, no-cache, must-revalidate');
 res.setHeader('X-Push-Server-Revision',SERVER_REVISION);
 const trace=String(req.headers['x-push-trace']||req.query?.diag||'no-trace').slice(0,80);
 console.info('push-send:request',{trace,revision:SERVER_REVISION,method:req.method,hasAuthorization:!!req.headers.authorization,hasBody:!!req.body});
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed',revision:SERVER_REVISION});
 let keySource='none',keyLength=0,keyFormat='missing';
 try{
  const token=String(req.headers.authorization||'').replace(/^Bearer\\s+/i,'');
  if(!token)return res.status(401).json({error:'Oturum gerekli.',revision:SERVER_REVISION});
  const verify=await fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key='+API_KEY,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({idToken:token})});
  const auth=await verify.json();const user=auth.users?.[0];if(!verify.ok||!user?.localId){const authCode=String(auth?.error?.message||'AUTH_LOOKUP_FAILED').slice(0,120);console.warn('push-send:auth-rejected',{trace,revision:SERVER_REVISION,httpStatus:verify.status,authCode});return res.status(401).json({error:'Oturum doğrulanamadı: '+authCode,authCode,revision:SERVER_REVISION});}
  const title=String(req.body?.title||'Çalışma Alanım').slice(0,90),body=String(req.body?.body||'Yeni bir bildirimin var.').slice(0,220);
  const sub=req.body?.subscription;
  if(!sub?.endpoint||!sub?.keys?.p256dh||!sub?.keys?.auth||!String(sub.endpoint).startsWith('https://'))return res.status(400).json({error:'Geçerli bir cihaz Push aboneliği gönderilmedi. Bildirimleri yeniden etkinleştir.',revision:SERVER_REVISION});
  const pushValue=process.env.PUSH_VAPID_PRIVATE_KEY;
  const legacyValue=process.env.VAPID_PRIVATE_KEY;
  const pushKey=typeof pushValue==='string'?pushValue.trim():'';
  const legacyKey=typeof legacyValue==='string'?legacyValue.trim():'';
  const vapidPrivateKey=pushKey||legacyKey;
  keySource=pushKey?'PUSH_VAPID_PRIVATE_KEY':legacyKey?'VAPID_PRIVATE_KEY':'none';
  keyLength=vapidPrivateKey.length;
  keyFormat=/^[A-Za-z0-9_-]{43}$/.test(vapidPrivateKey)?'base64url-43':'unexpected';
  console.info('push-send:configuration',{trace,revision:SERVER_REVISION,keySource,keyLength,keyFormat,webpushSetVapidDetails:typeof webpush.setVapidDetails,webpushSendNotification:typeof webpush.sendNotification});
  if(!vapidPrivateKey)throw new Error('VAPID_PRIVATE_KEY_NOT_AVAILABLE');
  if(keyFormat!=='base64url-43')throw new Error('VAPID_PRIVATE_KEY_FORMAT_INVALID');
  const subject=String(process.env.VAPID_SUBJECT||'mailto:calismaalanim451@gmail.com').trim();
  webpush.setVapidDetails(subject,VAPID_PUBLIC_KEY,vapidPrivateKey);
  const payload=JSON.stringify({title,body,url:'/'});
  await webpush.sendNotification(sub,payload);
  return res.status(200).json({sent:1,total:1,revision:SERVER_REVISION});
 }catch(error){
  const diagnostics={revision:SERVER_REVISION,keySource,keyLength,keyFormat};
  console.error('push-send:error',{trace,...diagnostics,name:error?.name,message:error?.message,statusCode:error?.statusCode,body:error?.body});
  const detail=String(error?.message||'Bilinmeyen sunucu hatası').slice(0,180);
  return res.status(500).json({error:'Push gönderimi başarısız: '+detail+' [server '+SERVER_REVISION+'; key '+keySource+'; length '+keyLength+'; format '+keyFormat+']',code:error?.statusCode||error?.code||error?.name||'SERVER_ERROR',diagnostics});
 }
}
