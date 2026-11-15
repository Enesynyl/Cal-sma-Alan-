import {requireAdmin,firestoreGet,firestoreList,fieldsToObject,json} from './_lib.js';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET')return json(res,405,{error:'Method not allowed'});
 try{
  const admin=await requireAdmin(req,res);if(!admin)return;
  const url=new URL(req.url,'https://local');const pageToken=url.searchParams.get('pageToken')||'';
  const q=new URL('https://identitytoolkit.googleapis.com/v1/projects/'+ 'calisma-alani-34ba7' +'/accounts:batchGet');
  q.searchParams.set('maxResults','100');if(pageToken)q.searchParams.set('nextPageToken',pageToken);
  const r=await fetch(q,{headers:{authorization:'Bearer '+admin.token}}),d=await r.json();
  if(!r.ok)throw new Error(d.error?.message||'AUTH_USERS_LIST_FAILED');
  const users=await Promise.all((d.users||[]).map(async u=>{
   let profile={};try{const p=await firestoreGet(admin.token,'users/'+u.localId+'/profile');if(p.ok)profile=fieldsToObject(p.data.fields)}catch{}
   return {uid:u.localId,email:u.email||'',displayName:u.displayName||profile.ad||'',createdAt:u.createdAt||'',lastLoginAt:u.lastLoginAt||'',emailVerified:!!u.emailVerified,disabled:!!u.disabled,profile};
  }));
  return json(res,200,{users,nextPageToken:d.nextPageToken||null,total:users.length});
 }catch(e){return json(res,500,{error:String(e.message||e)})}
}
