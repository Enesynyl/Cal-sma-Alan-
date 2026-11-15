import crypto from 'node:crypto';
import {requireAdmin,firestoreGet,json} from './_lib.js';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
 try{
  const token=String(req.headers.authorization||'').replace(/^Bearer\s+/i,'');if(!token)return json(res,401,{error:'Oturum gerekli'});
  const key='AIzaSyBQ3I3HgnLqrmfnPJCPiAfBj67CeifoxCI';
  const vr=await fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key='+key,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({idToken:token})});
  const vd=await vr.json(),u=vd.users?.[0];if(!vr.ok||!u)return json(res,401,{error:'Oturum doğrulanamadı'});
  const raw=process.env.FIREBASE_SERVICE_ACCOUNT_JSON;if(!raw)return json(res,503,{error:'FIREBASE_SERVICE_ACCOUNT_JSON_MISSING'});
  const sa=JSON.parse(raw),now=Math.floor(Date.now()/1000),enc=v=>Buffer.from(v).toString('base64url');
  const unsigned=enc(JSON.stringify({alg:'RS256',typ:'JWT'}))+'.'+enc(JSON.stringify({iss:sa.client_email,scope:'https://www.googleapis.com/auth/datastore',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600}));
  const sign=crypto.createSign('RSA-SHA256');sign.update(unsigned);sign.end();
  const tr=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:unsigned+'.'+sign.sign(sa.private_key,'base64url')})});
  const td=await tr.json();if(!tr.ok)throw new Error(td.error_description||'OAUTH_FAILED');
  const sub=req.body?.subscription;if(!sub?.endpoint||!sub?.keys?.p256dh||!sub?.keys?.auth)return json(res,400,{error:'Geçersiz cihaz aboneliği'});
  const id=crypto.createHash('sha256').update(sub.endpoint).digest('hex').slice(0,40),doc={fields:{endpoint:{stringValue:sub.endpoint},p256dh:{stringValue:sub.keys.p256dh},auth:{stringValue:sub.keys.auth},updatedAt:{timestampValue:new Date().toISOString()}}};
  const url='https://firestore.googleapis.com/v1/projects/calisma-alani-34ba7/databases/(default)/documents/users/'+u.localId+'/pushSubscriptions/'+id;
  const wr=await fetch(url,{method:'PATCH',headers:{authorization:'Bearer '+td.access_token,'content-type':'application/json'},body:JSON.stringify(doc)});
  const wd=await wr.json();if(!wr.ok)throw new Error(wd.error?.message||'SUBSCRIPTION_SAVE_FAILED');
  return json(res,200,{saved:true});
 }catch(e){return json(res,500,{error:String(e.message||e)})}
}
