const VAPID_PUBLIC_KEY='BGw8rJ8J3cezaV6dyXUIdD128S2gV2huDljsuzz5df0WrIyx7IaZSM9C2zodN2OYMQp5oWm_l0xMF8V7C5GfA5U';
export default function handler(req,res){
 if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
 res.setHeader('Cache-Control','no-store, no-cache, must-revalidate');
 return res.status(200).json({publicKey:VAPID_PUBLIC_KEY});
}
