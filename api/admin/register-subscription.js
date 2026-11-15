import crypto from 'node:crypto';
import {json} from './_lib.js';
const PROJECT='calisma-alani-34ba7',API_KEY='AIzaSyBQ3I3HgnLqrmfnPJCPiAfBj67CeifoxCI';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store, private');
 if(!['POST','DELETE'].includes(req.method))return json(res,405,{error:'Method not allowed'});
 try{
  const token=String(req.headers.authorization||'').replace(/^Bearer\s+/i,'');if(!token)return json(res,401,{error:'Oturum gerekli'});
  const vr=await fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key='+API_KEY,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({idToken:token})});
  const vd=await vr.json(),u=vd.users?.[0];if(!vr.ok||!u)return json(res,401,{error:'Oturum doğrulanamadı'});
  // User-scoped Firestore writes use the verified Firebase ID token and Firestore security rules.
  const sub=req.body?.subscription;
  if(!sub?.endpoint)return json(res,400,{error:'Cihaz aboneliği bulunamadı'});
  const id=crypto.createHash('sha256').update(sub.endpoint).digest('hex').slice(0,40);
  const url='https://firestore.googleapis.com/v1/projects/'+PROJECT+'/databases/(default)/documents/users/'+u.localId+'/pushSubscriptions/'+id;
  const headers={authorization:'Bearer '+token,'content-type':'application/json'};
  if(req.method==='DELETE'){
   const wr=await fetch(url,{method:'DELETE',headers});
   if(!wr.ok&&wr.status!==404){const wd=await wr.json().catch(()=>({}));throw new Error(wd.error?.message||'SUBSCRIPTION_DELETE_FAILED')}
   return json(res,200,{removed:true});
  }
  const deviceId=String(req.body?.deviceId||'');
  if(!/^[A-Za-z0-9_-]{8,80}$/.test(deviceId)||!sub.keys?.p256dh||!sub.keys?.auth)return json(res,400,{error:'Geçersiz cihaz aboneliği veya cihaz kimliği'});
  const doc={fields:{endpoint:{stringValue:sub.endpoint},p256dh:{stringValue:sub.keys.p256dh},auth:{stringValue:sub.keys.auth},deviceId:{stringValue:deviceId},updatedAt:{timestampValue:new Date().toISOString()}}};
  const wr=await fetch(url,{method:'PATCH',headers,body:JSON.stringify(doc)});
  const wd=await wr.json();if(!wr.ok)throw new Error(wd.error?.message||'SUBSCRIPTION_SAVE_FAILED');
  return json(res,200,{saved:true});
 }catch(e){console.error('push subscription update failed',e);return json(res,500,{error:String(e.message||e)})}
}
