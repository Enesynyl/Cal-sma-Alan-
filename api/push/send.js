import webpush from 'web-push';
const PROJECT='calisma-alani-34ba7';
const API_KEY='AIzaSyBQ3I3HgnLqrmfnPJCPiAfBj67CeifoxCI';
export default async function handler(req,res){
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 try{
  const token=String(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
  if(!token)return res.status(401).json({error:'Oturum gerekli.'});
  const verify=await fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key='+API_KEY,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({idToken:token})});
  const auth=await verify.json();const user=auth.users?.[0];if(!verify.ok||!user?.localId)return res.status(401).json({error:'Oturum doğrulanamadı.'});
  const title=String(req.body?.title||'Çalışma Alanım').slice(0,90),body=String(req.body?.body||'Yeni bir bildirimin var.').slice(0,220);
  const url='https://firestore.googleapis.com/v1/projects/'+PROJECT+'/databases/(default)/documents/users/'+user.localId+'/pushSubscriptions';
  const list=await fetch(url,{headers:{authorization:'Bearer '+token}});
  const docs=await list.json();if(!list.ok)return res.status(403).json({error:'Bildirim aboneliklerine erişilemedi. Firestore kullanıcı kurallarını kontrol et.'});
  const docsList=docs.documents||[];if(!docsList.length)return res.status(404).json({error:'Bu hesapta kayıtlı bildirim cihazı bulunamadı.'});
  webpush.setVapidDetails(process.env.VAPID_SUBJECT||'mailto:calismaalanim451@gmail.com',process.env.VAPID_PUBLIC_KEY,process.env.VAPID_PRIVATE_KEY);
  const payload=JSON.stringify({title,body,url:'/'});
  const results=await Promise.allSettled(docsList.map(async doc=>{
   const raw=doc.fields?.subscriptionJson?.stringValue;if(!raw)return false;
   const sub=JSON.parse(raw);await webpush.sendNotification(sub,payload);return true;
  }));
  const sent=results.filter(x=>x.status==='fulfilled'&&x.value).length;
  return res.status(200).json({sent,total:docsList.length});
 }catch(error){console.error('push-send:',error);return res.status(500).json({error:'Bildirim gönderilirken sunucu hatası oluştu.'})}
}