import crypto from 'node:crypto';
import {requireUser,googleToken,json} from './_lib.js';

const PROJECT='calisma-alani-34ba7';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store, private');
 if(!['POST','DELETE'].includes(req.method))return json(res,405,{error:'Method not allowed'});
 try{
  // Verify the signed-in Firebase user first; service credentials are used only
  // on the server to write inside that verified user's own document path.
  const user=await requireUser(req,res);if(!user)return;
  const sub=req.body?.subscription;
  // Aktif oturum kaydı da aynı doğrulanmış kullanıcı endpoint'i üzerinden yönetilir.
  // Böylece ayrı bir Serverless Function'a ihtiyaç kalmaz.
  if(!sub?.endpoint){
   const deviceId=String(req.body?.deviceId||'');
   if(!/^[A-Za-z0-9_-]{8,80}$/.test(deviceId))return json(res,400,{error:'Geçersiz cihaz kimliği.'});
   const sessionUrl='https://firestore.googleapis.com/v1/projects/'+PROJECT+'/databases/(default)/documents/users/'+user.uid+'/activeDevices/'+deviceId;
   const sessionHeaders={authorization:'Bearer '+await googleToken(),'content-type':'application/json'};
   if(req.method==='DELETE'){
    const removed=await fetch(sessionUrl,{method:'DELETE',headers:sessionHeaders});
    if(!removed.ok&&removed.status!==404){const detail=await removed.json().catch(()=>({}));throw new Error(detail.error?.message||'SESSION_DELETE_FAILED')}
    return json(res,200,{ok:true,active:false});
   }
   const now=Date.now();
   const saved=await fetch(sessionUrl,{method:'PATCH',headers:sessionHeaders,body:JSON.stringify({fields:{deviceId:{stringValue:deviceId},updatedAt:{integerValue:String(now)}}})});
   const detail=await saved.json().catch(()=>({}));
   if(!saved.ok)throw new Error(detail.error?.message||'SESSION_REGISTER_FAILED');
   return json(res,200,{ok:true,active:true,updatedAt:now});
  }
  const id=crypto.createHash('sha256').update(sub.endpoint).digest('hex').slice(0,40);
  const url='https://firestore.googleapis.com/v1/projects/'+PROJECT+'/databases/(default)/documents/users/'+user.uid+'/pushSubscriptions/'+id;
  const serviceToken=await googleToken();
  const headers={authorization:'Bearer '+serviceToken,'content-type':'application/json'};
  if(req.method==='DELETE'){
   const wr=await fetch(url,{method:'DELETE',headers});
   if(!wr.ok&&wr.status!==404){const wd=await wr.json().catch(()=>({}));throw new Error(wd.error?.message||'SUBSCRIPTION_DELETE_FAILED')}
   return json(res,200,{removed:true});
  }
  const deviceId=String(req.body?.deviceId||'');
  if(!/^[A-Za-z0-9_-]{8,80}$/.test(deviceId)||!sub.keys?.p256dh||!sub.keys?.auth)return json(res,400,{error:'Geçersiz cihaz aboneliği veya cihaz kimliği'});
  const updatedAt=new Date().toISOString();
  const doc={fields:{endpoint:{stringValue:sub.endpoint},p256dh:{stringValue:sub.keys.p256dh},auth:{stringValue:sub.keys.auth},deviceId:{stringValue:deviceId},updatedAt:{timestampValue:updatedAt}}};
  const ownerUrl='https://firestore.googleapis.com/v1/projects/'+PROJECT+'/databases/(default)/documents/pushSubscriptionOwners/'+id;
  // A browser push endpoint is unique to this browser profile. Keep one
  // authoritative owner so old account copies can never receive its pushes.
  const [wr,ownerWrite]=await Promise.all([
   fetch(url,{method:'PATCH',headers,body:JSON.stringify(doc)}),
   fetch(ownerUrl,{method:'PATCH',headers,body:JSON.stringify({fields:{uid:{stringValue:user.uid},updatedAt:{timestampValue:updatedAt}}})})
  ]);
  const [wd,od]=await Promise.all([wr.json().catch(()=>({})),ownerWrite.json().catch(()=>({}))]);
  if(!wr.ok||!ownerWrite.ok)throw new Error(wd.error?.message||od.error?.message||'SUBSCRIPTION_SAVE_FAILED');
  return json(res,200,{saved:true});
 }catch(e){console.error('push subscription update failed',e);return json(res,500,{error:String(e.message||e)})}
}
