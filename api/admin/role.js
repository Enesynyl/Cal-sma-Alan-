import {requireAdmin,json} from './_lib.js';
const PROJECT='calisma-alani-34ba7';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
 try{
  const admin=await requireAdmin(req,res);if(!admin)return;
  if(admin.email.toLowerCase()!=='ebsyonyol48@gmail.com')return json(res,403,{error:'Yalnızca ana yönetici rol atayabilir.'});
  const uid=String(req.body?.uid||'').trim(),enabled=!!req.body?.enabled;
  if(!uid||uid===admin.uid)return json(res,400,{error:'Geçerli bir kullanıcı seç.'});
  const lookup=await fetch('https://identitytoolkit.googleapis.com/v1/projects/'+PROJECT+'/accounts:lookup,{method:'POST',headers:{authorization:'Bearer '+admin.token,'content-type':'application/json'},body:JSON.stringify({localId:[uid]})});
  const ld=await lookup.json();if(!lookup.ok||!ld.users?.[0])return json(res,404,{error:'Kullanıcı bulunamadı.'});
  const user=ld.users[0];let attrs={};try{attrs=JSON.parse(user.customAttributes||'{}')}catch{}
  if(enabled)attrs.admin=true;else delete attrs.admin;
  const update=await fetch('https://identitytoolkit.googleapis.com/v1/projects/'+PROJECT+'/accounts:update,{method:'POST',headers:{authorization:'Bearer '+admin.token,'content-type':'application/json'},body:JSON.stringify({localId:uid,customAttributes:JSON.stringify(attrs),returnSecureToken:false})});
  const data=await update.json();if(!update.ok)throw new Error(data.error?.message||'ROLE_UPDATE_FAILED');
  return json(res,200,{ok:true,uid,admin:enabled,note:'Rol güncellendi. Kullanıcının yeniden giriş yapması gerekebilir.'});
 }catch(e){return json(res,500,{error:String(e.message||e)})}
}