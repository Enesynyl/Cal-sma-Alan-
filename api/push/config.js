const VAPID_PUBLIC_KEY='BGw8rJ8J3cezaV6dyXUIdD128S2gV2huDljsuzz5df0WrIyx7IaZSM9C2zodN2OYMQp5oWm_l0xMF8V7C5GfA5U';
const SERVER_REVISION='push-runtime-diagnostic-20261114-01';
export default function handler(req,res){
 if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
 res.setHeader('Cache-Control','no-store, no-cache, must-revalidate');
 res.setHeader('X-Push-Server-Revision',SERVER_REVISION);
 const raw=process.env.PUSH_VAPID_PRIVATE_KEY||process.env.VAPID_PRIVATE_KEY||'';
 const key=String(raw).trim();
 return res.status(200).json({
  publicKey:VAPID_PUBLIC_KEY,
  diagnostics:{
   revision:SERVER_REVISION,
   privateKeyPresent:!!key,
   privateKeyLength:key.length,
   privateKeyFormat:/^[A-Za-z0-9_-]{43}$/.test(key)?'base64url-43':'unexpected'
  }
 });
}
