import webpush from 'web-push';
const PROJECT='calisma-alani-34ba7';
const API_KEY='AIzaSyBQ3I3HgnLqrmfnPJCPiAfBj67CeifoxCI';
const VAPID_PUBLIC_KEY='BGw8rJ8J3cezaV6dyXUIdD128S2gV2huDljsuzz5df0WrIyx7IaZSM9C2zodN2OYMQp5oWm_l0xMF8V7C5GfA5U';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store, no-cache, must-revalidate');
 const trace=String(req.headers['x-push-trace']||req.query?.diag||'no-trace').slice(0,80);
 console.info('push-send:request',{trace,method:req.method,hasAuthorization:!!req.headers.authorization,hasBody:!!req.body});
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 try{
    const token=String(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
  if(!token)return res.status(401).json({error:'Oturum gerekli.'});
  const verify=await fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key='+API_KEY,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({idToken:token})});
  const auth=await verify.json();const user=auth.users?.[0];if(!verify.ok||!user?.localId)return res.status(401).json({error:'Oturum doğrulanamadı.'});
  const title=String(req.body?.title||'Çalışma Alanım').slice(0,90),body=String(req.body?.body||'Yeni bir bildirimin var.').slice(0,220);
  const sub=req.body?.subscription;
  if(!sub?.endpoint||!sub?.keys?.p256dh||!sub?.keys?.auth||!String(sub.endpoint).startsWith('https://'))return res.status(400).json({error:'Geçerli bir cihaz Push aboneliği gönderilmedi. Bildirimleri yeniden etkinleştir.'});
  webpush.setVapidDetails(process.env.VAPID_SUBJECT||'mailto:calismaalanim451@gmail.com',VAPID_PUBLIC_KEY,process.env.VAPID_PRIVATE_KEY);
  const payload=JSON.stringify({title,body,url:'/'});
  await webpush.sendNotification(sub,payload);
  return res.status(200).json({sent:1,total:1});
 }catch(error){
  console.error('push-send:',{trace,name:error?.name,message:error?.message,statusCode:error?.statusCode,body:error?.body});
  const detail=String(error?.message||'Bilinmeyen sunucu hatası').slice(0,240);
  return res.status(500).json({error:'Push gönderimi başarısız: '+detail,code:error?.statusCode||error?.code||error?.name||'SERVER_ERROR'});
 }
}
