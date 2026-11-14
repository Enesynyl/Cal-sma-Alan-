export default function handler(req,res){
 if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
 const publicKey=process.env.VAPID_PUBLIC_KEY;
 if(!publicKey)return res.status(503).json({error:'Web Push anahtarı yapılandırılmamış.'});
 res.setHeader('Cache-Control','no-store, no-cache, must-revalidate');
 return res.status(200).json({publicKey});
}