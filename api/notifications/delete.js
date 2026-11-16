import {requireUser,googleToken,firestoreGet,firestoreList,fieldsToObject,json} from '../admin/_lib.js';
const PROJECT='calisma-alani-34ba7';
const ROOT='https://firestore.googleapis.com/v1/projects/'+PROJECT+'/databases/(default)/documents';
const RESOURCE_ROOT='projects/'+PROJECT+'/databases/(default)/documents/';
const isAdminMessage=x=>x&&(x.source==='admin'||x.type==='Duyuru');
// Firestore helper'ı bazı yanıtlarda document.name alanını tam URL olarak döndürebilir.
// Commit API ise yalnızca projects/... biçimindeki kaynak adını kabul eder.
function resourceName(name){
 let value=String(name||'');
 if(value.startsWith('https://')||value.startsWith('http://')){
  try{value=new URL(value).pathname.replace(/^\\/v1\\//,'')}catch{}
 }
 value=value.replace(/^\\/+/, '');
 if(value.startsWith(RESOURCE_ROOT))return value;
 if(value.startsWith('users/'))return RESOURCE_ROOT+value;
 return value;
}
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store, private');
 if(req.method!=='POST')return json(res,405,{ok:false,error:'Method not allowed'});
 try{
  const user=await requireUser(req,res);if(!user)return;
  const token=await googleToken();
  const base='users/'+user.uid+'/notifications';
  const id=String(req.body?.id||'');
  let targets=[];
  if(req.body?.all===true){
   let page='',count=0;
   do{
    const d=await firestoreList(token,base,page);
    for(const doc of d.documents||[]){
     if(isAdminMessage(fieldsToObject(doc.fields||{})))targets.push(resourceName(doc.name));
    }
    page=d.nextPageToken||'';count++;
   }while(page&&count<5);
  }else{
   if(!/^admin_[A-Za-z0-9_-]{8,100}$/.test(id))return json(res,400,{ok:false,error:'Geçersiz duyuru kimliği.'});
   const path=base+'/'+id;
   const found=await firestoreGet(token,path);
   if(!found.ok)return json(res,404,{ok:false,error:'Duyuru bulunamadı.'});
   if(!isAdminMessage(fieldsToObject(found.data.fields||{})))return json(res,403,{ok:false,error:'Bu kayıt yönetici duyurusu değil.'});
   targets.push(RESOURCE_ROOT+path);
  }
  targets=[...new Set(targets.map(resourceName).filter(x=>x.startsWith(RESOURCE_ROOT)))];
  if(!targets.length)return json(res,200,{ok:true,deleted:0});
  let deleted=0;
  for(let i=0;i<targets.length;i+=400){
   const writes=targets.slice(i,i+400).map(name=>({delete:name}));
   const response=await fetch(ROOT+':commit',{method:'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:JSON.stringify({writes})});
   if(!response.ok){const detail=await response.text();throw new Error('Duyurular silinemedi: '+detail.slice(0,300))}
   deleted+=writes.length;
  }
  return json(res,200,{ok:true,deleted});
 }catch(e){console.error('notification delete failed',e);return json(res,500,{ok:false,error:String(e.message||e)})}
}
