import {requireUser,json} from '../admin/_lib.js';
const PROJECT='calisma-alani-34ba7';
function validId(v){return /^[A-Za-z0-9_-]{8,80}$/.test(String(v||''))}
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store, private');
 if(!['POST','DELETE'].includes(req.method))return json(res,405,{error:'Method not allowed'});
 try{
  const user=await requireUser(req,res);if(!user)return;
  const deviceId=String(req.body?.deviceId||'');
  if(!validId(deviceId))return json(res,400,{error:'Geçersiz cihaz kimliği.'});
  const url='https://firestore.googleapis.com/v1/projects/'+PROJECT+'/databases/(default)/documents/users/'+user.uid+'/activeDevices/'+deviceId;
  const headers={authorization:'Bearer '+user.token,'content-type':'application/json'};
  if(req.method==='DELETE'){
   const r=await fetch(url,{method:'DELETE',headers});
   if(!r.ok&&r.status!==404){const d=await r.json().catch(()=>({}));throw new Error(d.error?.message||'SESSION_DELETE_FAILED')}
   return json(res,200,{ok:true,active:false});
  }
  const now=Date.now();
  const r=await fetch(url,{method:'PATCH',headers,body:JSON.stringify({fields:{deviceId:{stringValue:deviceId},updatedAt:{integerValue:String(now)}}})});
  const d=await r.json();if(!r.ok)throw new Error(d.error?.message||'SESSION_REGISTER_FAILED');
  return json(res,200,{ok:true,active:true,updatedAt:now});
 }catch(e){console.error('device session error',e);return json(res,500,{error:String(e.message||e)})}
}
