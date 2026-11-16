import {requireAdmin,googleToken,firestoreList,fieldsToObject,json} from './admin/_lib.js';
const ROOT='https://firestore.googleapis.com/v1/projects/calisma-alani-34ba7/databases/(default)/documents';
const active=x=>x.status==='published'&&(!x.startAt||Number(x.startAt)<=Date.now())&&(!x.endAt||Number(x.endAt)>Date.now());
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store, max-age=0');
 try{
  if(req.method==='GET'){
   const adminMode=String(req.query?.admin||'')==='1';let token;
   if(adminMode){const a=await requireAdmin(req,res);if(!a)return;token=a.token}else token=await googleToken();
   const rows=[];let page='',count=0;
   do{const d=await firestoreList(token,'adminCampaigns',page);for(const doc of d.documents||[])rows.push({id:doc.name.split('/').pop(),...fieldsToObject(doc.fields||{})});page=d.nextPageToken||'';count++}while(page&&count<5);
   rows.sort((a,b)=>Number(b.createdAt||0)-Number(a.createdAt||0));
   return json(res,200,{campaigns:adminMode?rows:rows.filter(active)});
  }
  const admin=await requireAdmin(req,res);if(!admin)return;
  const body=req.body||{},id=String(body.id||'').trim();
  if(req.method==='POST'){
   const imageData=String(body.imageData||'').trim(),linkUrl=String(body.linkUrl||'').trim(),description=String(body.description||'').trim().slice(0,500);
   const startAt=body.startAt?Date.parse(body.startAt):0,endAt=body.endAt?Date.parse(body.endAt):0;
   if(!imageData||!/^data:image\/(jpeg|webp|png);base64,[A-Za-z0-9+/=]+$/.test(imageData)||imageData.length>550000)return json(res,400,{error:'Geçerli bir görsel seç (en fazla 380 KB).'});
   if(linkUrl&&!/^https:\/\//i.test(linkUrl))return json(res,400,{error:'Bağlantı https:// ile başlamalı.'});
   if(body.endAt&&(!endAt||endAt<=Date.now()))return json(res,400,{error:'Bitiş zamanı gelecekte olmalı.'});
   if(body.startAt&&(!startAt||startAt<Date.now()-60000))return json(res,400,{error:'Başlangıç zamanı geçmişte olamaz.'});
   if(startAt&&endAt&&endAt<=startAt)return json(res,400,{error:'Bitiş zamanı başlangıçtan sonra olmalı.'});
   const newId='cmp_'+Date.now()+'_'+Math.random().toString(36).slice(2,8),now=Date.now();
   const fields={imageData:{stringValue:imageData},description:{stringValue:description},linkUrl:{stringValue:linkUrl},status:{stringValue:body.status==='draft'?'draft':'published'},startAt:{integerValue:String(startAt)},endAt:{integerValue:String(endAt)},createdAt:{integerValue:String(now)},updatedAt:{integerValue:String(now)}};
   const r=await fetch(ROOT+'/adminCampaigns/'+newId,{method:'PATCH',headers:{authorization:'Bearer '+admin.token,'content-type':'application/json'},body:JSON.stringify({fields})});
   if(!r.ok)throw new Error((await r.text()).slice(0,400));return json(res,200,{ok:true,id:newId});
  }
  if(req.method==='PATCH'){
   if(!/^cmp_[A-Za-z0-9_-]{8,100}$/.test(id))return json(res,400,{error:'Kampanya kimliği geçersiz.'});
   const r=await fetch(ROOT+'/adminCampaigns/'+id,{headers:{authorization:'Bearer '+admin.token}});
   if(!r.ok)return json(res,404,{error:'Kampanya bulunamadı.'});
   const old=fieldsToObject((await r.json()).fields||{}),fields={};
   for(const [k,v] of Object.entries(old)){fields[k]=typeof v==='number'?{integerValue:String(v)}:{stringValue:String(v??'')}}
   if(body.status)fields.status={stringValue:body.status==='published'?'published':'paused'};
   if(body.endAt!==undefined){const t=body.endAt?Date.parse(body.endAt):0;if(body.endAt&&(!t||t<=Date.now()))return json(res,400,{error:'Bitiş zamanı gelecekte olmalı.'});fields.endAt={integerValue:String(t)}}
   fields.updatedAt={integerValue:String(Date.now())};
   const w=await fetch(ROOT+'/adminCampaigns/'+id,{method:'PATCH',headers:{authorization:'Bearer '+admin.token,'content-type':'application/json'},body:JSON.stringify({fields})});
   if(!w.ok)throw new Error((await w.text()).slice(0,400));return json(res,200,{ok:true});
  }
  if(req.method==='DELETE'){
   if(!/^cmp_[A-Za-z0-9_-]{8,100}$/.test(id))return json(res,400,{error:'Kampanya kimliği geçersiz.'});
   const r=await fetch(ROOT+'/adminCampaigns/'+id,{method:'DELETE',headers:{authorization:'Bearer '+admin.token}});
   if(!r.ok&&r.status!==404)throw new Error((await r.text()).slice(0,400));return json(res,200,{ok:true});
  }
  return json(res,405,{error:'Method not allowed'});
 }catch(e){console.error('campaign api',e);return json(res,500,{error:String(e.message||e)})}
}