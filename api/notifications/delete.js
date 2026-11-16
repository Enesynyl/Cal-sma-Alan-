import {requireUser,googleToken,firestoreGet,firestoreList,fieldsToObject,json} from '../admin/_lib.js';
const PROJECT='calisma-alani-34ba7';
const ROOT='https://firestore.googleapis.com/v1/projects/'+PROJECT+'/databases/(default)/documents';
const RESOURCE_ROOT='projects/'+PROJECT+'/databases/(default)/documents/';
const isAdminMessage=x=>x&&(x.source==='admin'||x.type==='Duyuru');
const validId=id=>/^admin_[A-Za-z0-9_-]{8,100}$/.test(String(id||''));
const resourceFor=(uid,id)=>RESOURCE_ROOT+'users/'+uid+'/notifications/'+id;
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store, private');
 if(req.method!=='POST')return json(res,405,{ok:false,error:'Method not allowed'});
 try{
  const user=await requireUser(req,res);if(!user)return;
  const token=await googleToken(),base='users/'+user.uid+'/notifications';
  const id=String(req.body?.id||'');
  const targets=[];
  if(req.body?.all===true){
   let page='',count=0;
   do{
    const result=await firestoreList(token,base,page);
    for(const doc of result.documents||[]){
     const docId=String(doc.name||'').split('/').pop();
     if(validId(docId)&&isAdminMessage(fieldsToObject(doc.fields||{})))targets.push(resourceFor(user.uid,docId));
    }
    page=result.nextPageToken||'';count++;
   }while(page&&count<20);
  }else{
   if(!validId(id))return json(res,400,{ok:false,error:'Geçersiz duyuru kimliği.'});
   const found=await firestoreGet(token,base+'/'+id);
   if(!found.ok)return json(res,404,{ok:false,error:'Duyuru bulunamadı.'});
   if(!isAdminMessage(fieldsToObject(found.data.fields||{})))return json(res,403,{ok:false,error:'Bu kayıt yönetici duyurusu değil.'});
   targets.push(resourceFor(user.uid,id));
  }
  const unique=[...new Set(targets)];
  if(!unique.length)return json(res,200,{ok:true,deleted:0});
  let deleted=0;
  for(let i=0;i<unique.length;i+=400){
   const writes=unique.slice(i,i+400).map(name=>({delete:name}));
   const response=await fetch(ROOT+':commit',{
    method:'POST',
    headers:{authorization:'Bearer '+token,'content-type':'application/json'},
    body:JSON.stringify({writes})
   });
   if(!response.ok){
    const detail=await response.text();
    console.error('Firestore notification delete rejected',response.status,detail);
    return json(res,502,{ok:false,error:'Firestore duyuruyu silemedi ('+response.status+'): '+detail.slice(0,220)});
   }
   deleted+=writes.length;
  }
  return json(res,200,{ok:true,deleted});
 }catch(e){
  console.error('notification delete failed',e);
  return json(res,500,{ok:false,error:String(e.message||e)});
 }
}
