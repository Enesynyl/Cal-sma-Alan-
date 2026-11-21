export default async function handler(req,res){
  if(req.method!=="POST"){res.setHeader("Allow","POST");return res.status(405).json({error:"Yalnızca POST kabul edilir."})}
  const key=process.env.GROQ_API_KEY;
  if(!key)return res.status(503).json({error:"AI henüz yapılandırılmadı. Vercel ortamında GROQ_API_KEY eksik."});
  try{
    const body=req.body||{};
    const messages=Array.isArray(body.messages)?body.messages.slice(-20):[];
    if(!messages.length||messages.some(m=>!["user","assistant"].includes(m.role)||typeof m.content!=="string"||m.content.length>12000))return res.status(400).json({error:"Mesaj formatı geçersiz."});
    const system={role:"system",content:"Sen Çalışma Alanım uygulamasının Türkçe konuşan, sıcak, kısa ve faydalı AI asistanısın. Öğrencilerin planlama, öğrenme ve üretkenlik ihtiyaçlarına yardım et. Uygulama verilerine erişimin yoksa bunu açıkça belirt; uydurma görev veya veri üretme. Güvenli ve uygulanabilir öneriler ver."};
    const response=await fetch("https://api.groq.com/openai/v1/chat/completions",{method:"POST",headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({model:process.env.GROQ_MODEL||"openai/gpt-oss-120b",messages:[system,...messages],temperature:0.7,max_tokens:900})});
    const data=await response.json();
    if(!response.ok)return res.status(response.status>=500?502:response.status).json({error:data?.error?.message||"AI sağlayıcısı isteği reddetti."});
    return res.status(200).json({reply:data?.choices?.[0]?.message?.content||"Yanıt oluşturulamadı."});
  }catch(err){console.error("AI endpoint error",err);return res.status(500).json({error:"AI isteği sırasında sunucu hatası."})}
}