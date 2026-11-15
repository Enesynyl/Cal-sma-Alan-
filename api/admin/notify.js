import webpush from 'web-push';
import {requireAdmin,firestoreList,fieldsToObject,json} from './_lib.js';
const PUBLIC='BK-0Z26P6-lQmXI8MKkRmCKlPvPQKS5bfqz9MZz_vjmzxwAKEM5JzzyBrFv5lsb8q9gxVdKPfh1at_cVjpdyusA';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
 try{
  const admin=await requireAdmin(req,res);if(!admin)return;
  const title=String(req.body?.title||'').trim().slice(0,90),body=String(req.body?.body||'').trim().slice(0,220),target=req.body?.target||'all',uids=Array.isArray(req.body?.uids)?req.body.uids.slice(0,100):[],imageUrl=String(req.body?.imageUrl||'').trim().slice(0,2000),linkUrl=String(req.body?.linkUrl||'').trim().slice(0,2000);
  if(!title||!body)return json(res,400,{error:'Başlık ve mesaj zorunludur.'});if(linkUrl&&!/^https:\/\//i.test(linkUrl))return json(res,400,{error:'Bağlantı https:// ile başlamalı.'});
  const key=String(process.env.VAPID_PRIVATE_KEY||'').trim();if(!key)return json(res,503,{error:'Push anahtarı yapılandırılmamış.'});
  webpush.setVapidDetails(String(process.env.VAPID_SUBJECT||'mailto:calismaalanim451@gmail.com'),PUBLIC,key);
  let users=[];
  if(target==='all'){
   let page='',count=0;do{const q=new URL('https://identitytoolkit.googleapis.com/v1/projects/calisma-alani-34ba7/accounts:batchGet');q.searchParams.set('maxResults','1000');if(page)q.searchParams.set('nextPageToken',page);const r=await fetch(q,{headers:{authorization:'Bearer '+admin.token}}),d=await r.json();if(!r.ok)throw new Error(d.error?.message||'AUTH_USERS_LIST_FAILED');users.push(...(d.users||[]).map(x=>x.localId));page=d.nextPageToken||'';count++}while(page&&count<10);
  }else users=uids;
  const subs=[];
  for(const uid of users){try{const d=await firestoreList(admin.token,'users/'+uid+'/pushSubscriptions');for(const x of d.documents||[]){const s=fieldsToObject(x.fields);subs.push({uid,subscription:{endpoint:s.endpoint,keys:{p256dh:s.p256dh,auth:s.auth}}})}}catch{}}
  const payload=JSON.stringify({title,body,url:linkUrl||'/',image:imageUrl||undefined,tag:'admin-'+Date.now()});
  const results=await Promise.allSettled(subs.map(x=>webpush.sendNotification(x.subscription,payload)));
  const sent=results.filter(x=>x.status==='fulfilled').length,failed=results.length-sent;
  const batch=await fetch('https://firestore.googleapis.com/v1/projects/calisma-alani-34ba7/databases/(default)/documents:commit',{method:'POST',headers:{authorization:'Bearer '+admin.token,'content-type':'application/json'},body:JSON.stringify({writes:users.map(uid=>({update:{name:'projects/calisma-alani-34ba7/databases/(default)/documents/users/'+uid+'/notifications/admin_'+Date.now()+'_'+Math.random().toString(36).slice(2,7),fields:{title:{stringValue:title},body:{stringValue:body},type:{stringValue:'Duyuru'},source:{stringValue:'admin'},createdAt:{integerValue:String(Date.now())},...(imageUrl?{imageUrl:{stringValue:imageUrl}}:{}),...(linkUrl?{linkUrl:{stringValue:linkUrl}}:{})}}}))})});
  if(!batch.ok)console.warn('in-app announcement write failed',await batch.text());
  return json(res,200,{ok:true,users:users.length,devices:subs.length,sent,failed,note:'Uygulama içi duyuru kullanıcıların bildirim akışına eklendi.'});
 }catch(e){return json(res,500,{error:String(e.message||e)})}
}
