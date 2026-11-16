import {requireUser,googleToken,firestoreList,fieldsToObject,json} from '../admin/_lib.js';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store, private');
 if(req.method!=='GET')return json(res,405,{error:'Method not allowed'});
 try{
  const user=await requireUser(req,res);if(!user)return;
  // The user is authenticated above; read only their own inbox using the
  // server credential so client Firestore rules do not block the inbox API.
  const serviceToken=await googleToken();
  const rows=[];let page='',count=0;
  do{
   const d=await firestoreList(serviceToken,'users/'+user.uid+'/notifications',page);
   for(const doc of d.documents||[]){
    const x=fieldsToObject(doc.fields||{});
    rows.push({id:doc.name.split('/').pop(),title:x.title||'Yönetici duyurusu',body:x.body||'',type:x.type||'Duyuru',source:x.source||'',createdAt:Number(x.createdAt||0),imageUrl:x.imageUrl||'',linkUrl:x.linkUrl||''});
   }
   page=d.nextPageToken||'';count++;
  }while(page&&count<5);
  rows.sort((a,b)=>b.createdAt-a.createdAt);
  return json(res,200,{ok:true,notifications:rows.slice(0,100)});
 }catch(e){console.error('notification inbox read failed',e);return json(res,500,{error:String(e.message||e)})}
}
