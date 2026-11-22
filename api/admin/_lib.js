import crypto from 'node:crypto';
const PROJECT='calisma-alani-34ba7';
const API_KEY='AIzaSyBQ3I3HgnLqrmfnPJCPiAfBj67CeifoxCI';
const ADMIN_EMAIL='ebsyonyol48@gmail.com';
let cached=null;
function b64(v){return Buffer.from(v).toString('base64url')}
export async function googleToken(){
 if(cached&&cached.exp>Date.now()+60000)return cached.token;
 const raw=process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
 if(!raw)throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON_MISSING');
 const sa=JSON.parse(raw),now=Math.floor(Date.now()/1000);
 const head=b64(JSON.stringify({alg:'RS256',typ:'JWT'}));
 const claim=b64(JSON.stringify({iss:sa.client_email,scope:'https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/firebase',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600}));
 const unsigned=head+'.'+claim;
 const sign=crypto.createSign('RSA-SHA256');sign.update(unsigned);sign.end();
 const assertion=unsigned+'.'+sign.sign(sa.private_key,'base64url');
 const r=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion})});
 const d=await r.json();if(!r.ok)throw new Error(d.error_description||'GOOGLE_OAUTH_FAILED');
 cached={token:d.access_token,exp:Date.now()+d.expires_in*1000};return cached.token;
}
export async function requireUser(req,res){
 const token=String(req.headers.authorization||'').replace(/^Bearer\s+/i,'');if(!token){res.status(401).json({error:'Oturum gerekli.'});return null}
 const v=await fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key='+API_KEY,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({idToken:token})});
 const d=await v.json(),u=d.users?.[0];if(!v.ok||!u){res.status(401).json({error:'Oturum doğrulanamadı.'});return null}
 return {uid:u.localId,token};
}
export async function requireAdmin(req,res){
 const token=String(req.headers.authorization||'').replace(/^Bearer\s+/i,'');if(!token){res.status(401).json({error:'Oturum gerekli.'});return null}
 const v=await fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key='+API_KEY,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({idToken:token})});
 const d=await v.json(),u=d.users?.[0];if(!v.ok||!u){res.status(401).json({error:'Oturum doğrulanamadı.'});return null}
 let attrs={};try{attrs=JSON.parse(u.customAttributes||'{}')}catch{};
 if(String(u.email||'').toLowerCase()!==ADMIN_EMAIL||!u.emailVerified){res.status(403).json({error:'Bu işlem yalnızca yönetici hesabına açıktır.'});return null}
 try{return {uid:u.localId,email:u.email,token:await googleToken()}}catch(e){res.status(503).json({error:'Yönetici servisi yapılandırılmamış: '+e.message});return null}
}
export async function firestoreGet(token,path){
 const r=await fetch('https://firestore.googleapis.com/v1/projects/'+PROJECT+'/databases/(default)/documents/'+path,{headers:{authorization:'Bearer '+token}});
 const d=await r.json();if(!r.ok&&r.status!==404)throw new Error(d.error?.message||'FIRESTORE_READ_FAILED');return {ok:r.ok,data:d};
}
export async function firestoreList(token,path,pageToken){
 const url=new URL('https://firestore.googleapis.com/v1/projects/'+PROJECT+'/databases/(default)/documents/'+path);
 url.searchParams.set('pageSize','100');if(pageToken)url.searchParams.set('pageToken',pageToken);
 const r=await fetch(url,{headers:{authorization:'Bearer '+token}}),d=await r.json();if(!r.ok)throw new Error(d.error?.message||'FIRESTORE_LIST_FAILED');return d;
}
export function fieldsToObject(fields={}){const out={};for(const [k,v] of Object.entries(fields)){out[k]=v.stringValue??v.integerValue??v.doubleValue??v.booleanValue??v.timestampValue??(v.mapValue?fieldsToObject(v.mapValue.fields):v.arrayValue?.values?.map(x=>x.stringValue??x.integerValue??x.booleanValue)??null)}return out}
export function json(res,code,data){return res.status(code).json(data)}
