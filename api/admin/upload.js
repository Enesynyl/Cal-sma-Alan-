import {requireAdmin,json} from './_lib.js';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
 try{
  const admin=await requireAdmin(req,res);if(!admin)return;
  const cloud=String(process.env.CLOUDINARY_CLOUD_NAME||'').trim();
  const preset=String(process.env.CLOUDINARY_UPLOAD_PRESET||'').trim();
  if(!cloud||!preset)return json(res,503,{error:'Ücretsiz görsel depolama henüz yapılandırılmadı. Cloudinary hesap bilgileri gerekli.'});
  const data=String(req.body?.data||''),match=data.match(/^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/=]+)$/);
  if(!match)return json(res,400,{error:'PNG, JPG, WEBP veya GIF görseli seç.'});
  const bytes=Buffer.from(match[2],'base64');if(bytes.length>3*1024*1024)return json(res,413,{error:'Görsel en fazla 3 MB olabilir.'});
  const form=new FormData();
  form.append('file',new Blob([bytes],{type:match[1]}),'announcement.'+({'image/png':'png','image/jpeg':'jpg','image/webp':'webp','image/gif':'gif'})[match[1]]);
  form.append('upload_preset',preset);
  form.append('folder','calisma-alanim/announcements');
  const response=await fetch('https://api.cloudinary.com/v1_1/'+encodeURIComponent(cloud)+'/image/upload',{method:'POST',body:form});
  const result=await response.json();
  if(!response.ok)throw new Error(result.error?.message||'Cloudinary görsel yüklemesi başarısız.');
  if(!result.secure_url)throw new Error('Görsel adresi alınamadı.');
  return json(res,200,{ok:true,url:result.secure_url,publicId:result.public_id});
 }catch(e){return json(res,500,{error:String(e.message||e)})}
}