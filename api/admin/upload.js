import crypto from 'node:crypto';
import {requireAdmin,json} from './_lib.js';
const PROJECT='calisma-alani-34ba7';
async function resolveBucket(token){
 const configured=String(process.env.FIREBASE_STORAGE_BUCKET||'').trim().replace(/^gs:\/\//,'');
 if(configured)return configured;
 const r=await fetch('https://storage.googleapis.com/storage/v1/b?project='+PROJECT,{headers:{authorization:'Bearer '+token}});
 const d=await r.json();
 if(!r.ok)throw new Error(d.error?.message||'Storage bucket listelenemedi. Service account için Storage erişimi gerekli.');
 const buckets=d.items||[];
 if(!buckets.length)throw new Error('Firebase Storage için henüz bucket oluşturulmamış. Firebase Console → Storage → Get started bölümünden bucket oluşturulmalı.');
 const preferred=buckets.find(b=>b.name===PROJECT+'.firebasestorage.app')||buckets.find(b=>b.name===PROJECT+'.appspot.com')||buckets.find(b=>b.name.startsWith(PROJECT))||buckets[0];
 return preferred.name;
}
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
 try{
  const admin=await requireAdmin(req,res);if(!admin)return;
  const data=String(req.body?.data||''),match=data.match(/^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/=]+)$/);
  if(!match)return json(res,400,{error:'PNG, JPG, WEBP veya GIF görseli seç.'});
  const bytes=Buffer.from(match[2],'base64');if(bytes.length>3*1024*1024)return json(res,413,{error:'Görsel en fazla 3 MB olabilir.'});
  const bucket=await resolveBucket(admin.token);
  const ext=({'image/png':'png','image/jpeg':'jpg','image/webp':'webp','image/gif':'gif'})[match[1]],name='announcements/'+Date.now()+'-'+crypto.randomBytes(6).toString('hex')+'.'+ext,token=crypto.randomUUID();
  const upload=await fetch('https://storage.googleapis.com/upload/storage/v1/b/'+encodeURIComponent(bucket)+'/o?uploadType=media&name='+encodeURIComponent(name),{method:'POST',headers:{authorization:'Bearer '+admin.token,'content-type':match[1]},body:bytes});
  const obj=await upload.json();if(!upload.ok)throw new Error(obj.error?.message||'Görsel yüklenemedi. Storage bucket veya service account izinlerini kontrol et.');
  const patch=await fetch('https://storage.googleapis.com/storage/v1/b/'+encodeURIComponent(bucket)+'/o/'+encodeURIComponent(name),{method:'PATCH',headers:{authorization:'Bearer '+admin.token,'content-type':'application/json'},body:JSON.stringify({metadata:{firebaseStorageDownloadTokens:token}})});
  const meta=await patch.json();if(!patch.ok)throw new Error(meta.error?.message||'Görsel bağlantısı oluşturulamadı.');
  const url='https://firebasestorage.googleapis.com/v0/b/'+encodeURIComponent(bucket)+'/o/'+encodeURIComponent(name)+'?alt=media&token='+token;
  return json(res,200,{ok:true,url});
 }catch(e){return json(res,500,{error:String(e.message||e)})}
}