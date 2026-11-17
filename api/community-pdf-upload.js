import {requireUser,json} from './admin/_lib.js';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return json(res,405,{ok:false,error:'Method not allowed'});
 try{
  const user=await requireUser(req,res);if(!user)return;
  const cloud=String(process.env.CLOUDINARY_CLOUD_NAME||'').trim(),preset=String(process.env.CLOUDINARY_UPLOAD_PRESET||'').trim();
  if(!cloud||!preset)return json(res,503,{ok:false,error:'PDF depolama servisi yapılandırılmamış. Cloudinary ayarları gerekli.'});
  const data=String(req.body?.data||''),match=data.match(/^data:application\/pdf;base64,([A-Za-z0-9+/=]+)$/i);
  if(!match)return json(res,400,{ok:false,error:'Yalnızca PDF dosyası yükleyebilirsin.'});
  const bytes=Buffer.from(match[1],'base64');if(bytes.length>3*1024*1024)return json(res,413,{ok:false,error:'PDF dosyası en fazla 3 MB olabilir.'});
  if(bytes.subarray(0,5).toString()!=='%PDF-')return json(res,400,{ok:false,error:'Dosya geçerli bir PDF değil.'});
  const name=String(req.body?.name||'ders-notu').replace(/[^a-zA-Z0-9_-]/g,'-').slice(0,70)||'ders-notu';
  const form=new FormData();form.append('file',new Blob([bytes],{type:'application/pdf'}),name+'.pdf');form.append('upload_preset',preset);form.append('folder','calisma-alanim/pdf-library');
  const response=await fetch('https://api.cloudinary.com/v1_1/'+encodeURIComponent(cloud)+'/raw/upload',{method:'POST',body:form});
  const result=await response.json();if(!response.ok)throw new Error(result.error?.message||'PDF yüklenemedi.');
  if(!result.secure_url)return json(res,502,{ok:false,error:'PDF bağlantısı alınamadı.'});
  return json(res,200,{ok:true,url:result.secure_url,publicId:result.public_id});
 }catch(e){return json(res,500,{ok:false,error:String(e.message||e)})}
}
