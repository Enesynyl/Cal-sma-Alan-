/* Student profile editor and identity card. */
let CA_PROFILE_CACHE=null,CA_PROFILE_CACHE_AT=0,CA_PROFILE_DRAFT_PHOTO=null,CA_PROFILE_REMOVE_PHOTO=false;
async function caProfileApi(action,data={}){
 const user=FB?.auth?.currentUser;if(!user)throw new Error('Profilini düzenlemek için hesabına giriş yapmalısın.');
 const token=await user.getIdToken(),r=await fetch('/api/community',{method:'POST',cache:'no-store',headers:{'content-type':'application/json',authorization:'Bearer '+token},body:JSON.stringify({action,...data})});
 const d=await r.json().catch(()=>({}));if(!r.ok||d.ok===false)throw new Error(d.error||'Profil işlemi tamamlanamadı.');return d;
}
async function caProfileGet(force=false){
 if(!force&&CA_PROFILE_CACHE&&Date.now()-CA_PROFILE_CACHE_AT<60000)return CA_PROFILE_CACHE;
 const d=await caProfileApi('getProfile');CA_PROFILE_CACHE=d.profile||{};CA_PROFILE_CACHE_AT=Date.now();return CA_PROFILE_CACHE;
}
const caProfileEsc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function caProfileAvatar(p,size='large'){
 const photo=p?.photoURL;
 return photo?'<img class="ca-profile-avatar '+size+'" src="'+caProfileEsc(photo)+'" alt="Profil fotoğrafı">':'<span class="ca-profile-avatar '+size+'">'+caProfileEsc((p?.ad||p?.displayName||'Ö').trim().slice(0,1).toLocaleUpperCase('tr'))+'</span>';
}
async function profilePage(){
 let p;try{p=await caProfileGet(true)}catch(x){return '<section class="ca-profile-page"><div class="card"><h2>Profil</h2><p>'+caProfileEsc(x.message)+'</p><button onclick="render()">Yeniden dene</button></div></section>'}
 CA_PROFILE_DRAFT_PHOTO=null;CA_PROFILE_REMOVE_PHOTO=false;
 const education=p.egitimDurumu||((p.universite||'').includes('Üniversitesi')?'öğrenci':p.universite==='Mezun'?'mezun':'öğrenci değil');
 return `<section class="ca-profile-page">
  <header class="ca-profile-heading"><button type="button" onclick="cur.m='bugun';render()">‹ Bugün</button><div><span>HESAP VE KİŞİSEL BİLGİLER</span><h1>Profil düzenleme</h1><p>Bilgilerini ve profil fotoğrafını buradan güncelleyebilirsin.</p></div></header>
  <form class="ca-profile-card" onsubmit="caProfileSave(event)">
   <div class="ca-profile-photo-row"><div id="ca-profile-photo-preview">${caProfileAvatar(p,'preview')}</div><div><b>Profil fotoğrafı</b><p>Fotoğrafın arkadaş aramalarında ve Bugün sayfasında yuvarlak görünür.</p><label class="ca-profile-file">Fotoğraf seç<input id="ca-profile-photo" type="file" accept="image/png,image/jpeg,image/webp" onchange="caProfilePhotoChanged(this)"></label><button type="button" class="ca-profile-remove" onclick="caProfileRemovePhoto()">Fotoğrafı kaldır</button></div></div>
   <div class="ca-profile-grid">
    <label>Ad soyad<input id="ca-profile-name" required minlength="4" maxlength="80" value="${caProfileEsc(p.ad||p.displayName||'')}" placeholder="Adın ve soyadın"></label>
    <label>E-posta<input id="ca-profile-email" type="email" value="${caProfileEsc(FB?.auth?.currentUser?.email||p.email||'')}" placeholder="ornek@eposta.com"></label>
    <label>Öğrenim durumu<select id="ca-profile-education" onchange="caProfileEducationChanged(this.value)"><option value="öğrenci" ${education==='öğrenci'?'selected':''}>Öğrenci</option><option value="mezun" ${education==='mezun'?'selected':''}>Mezun</option><option value="öğrenci değil" ${education==='öğrenci değil'?'selected':''}>Üniversite öğrencisi değil</option></select></label>
    <label>Üniversite<input id="ca-profile-university" value="${caProfileEsc(p.universite||'')}" placeholder="Üniversite adı"></label>
    <label>Bölüm<input id="ca-profile-department" value="${caProfileEsc(p.bolum||'')}" placeholder="Bölümün"></label>
    <label>Sınıf<input id="ca-profile-year" value="${caProfileEsc(p.sinif||'')}" placeholder="Örn. 2. sınıf"></label>
   </div>
   <div class="ca-profile-id"><div><small>ÖĞRENCİ ID'N</small><b id="ca-profile-id-value">${caProfileEsc(p.studentId||'Atanıyor…')}</b><p>Arkadaşların seni bu ID ile de bulabilir.</p></div><button type="button" onclick="caProfileCopyId()">Kopyala</button></div>
   <div class="ca-profile-actions"><span id="ca-profile-status" role="status"></span><button class="p" type="submit">Değişiklikleri kaydet</button></div>
  </form>
 </section>`;
}
async function caProfilePhotoChanged(input){
 const file=input.files?.[0];if(!file)return;
 if(!/^image\/(jpeg|png|webp)$/i.test(file.type)){toast('JPG, PNG veya WEBP fotoğraf seç.');input.value='';return}
 if(file.size>8*1024*1024){toast('Fotoğraf en fazla 8 MB olabilir.');input.value='';return}
 try{
  const bitmap=await createImageBitmap(file),canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
  const scale=Math.min(1,720/Math.max(bitmap.width,bitmap.height));canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close?.();
  let blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.78));
  for(let i=0;blob&&blob.size>185000&&i<5;i++)blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.68-i*.06));
  if(!blob||blob.size>185000)throw new Error('Fotoğraf küçültülemedi. Daha küçük bir görsel dene.');
  CA_PROFILE_DRAFT_PHOTO=await new Promise((resolve,reject)=>{const fr=new FileReader();fr.onload=()=>resolve(fr.result);fr.onerror=()=>reject(new Error('Fotoğraf okunamadı.'));fr.readAsDataURL(blob)});
  CA_PROFILE_REMOVE_PHOTO=false;const box=document.getElementById('ca-profile-photo-preview');if(box)box.innerHTML=caProfileAvatar({photoURL:CA_PROFILE_DRAFT_PHOTO},'preview');
 }catch(x){toast(x.message||'Fotoğraf hazırlanamadı.')}
}
function caProfileRemovePhoto(){CA_PROFILE_DRAFT_PHOTO='';CA_PROFILE_REMOVE_PHOTO=true;const box=document.getElementById('ca-profile-photo-preview');if(box)box.innerHTML=caProfileAvatar({ad:document.getElementById('ca-profile-name')?.value||'Ö'},'preview');const input=document.getElementById('ca-profile-photo');if(input)input.value=''}
function caProfileEducationChanged(value){const student=value==='öğrenci';['ca-profile-university','ca-profile-department','ca-profile-year'].forEach(id=>{const el=document.getElementById(id);if(el){el.disabled=!student;el.closest('label')?.classList.toggle('is-disabled',!student)}})}
async function caProfileCopyId(){const id=document.getElementById('ca-profile-id-value')?.textContent||'';try{await navigator.clipboard.writeText(id);toast('Öğrenci ID kopyalandı.')}catch(x){toast(id)}}
async function caProfileSave(ev){
 ev.preventDefault();const status=document.getElementById('ca-profile-status'),user=FB?.auth?.currentUser;
 const ad=document.getElementById('ca-profile-name').value.trim().replace(/\s+/g,' '),email=document.getElementById('ca-profile-email').value.trim(),egitimDurumu=document.getElementById('ca-profile-education').value,universite=document.getElementById('ca-profile-university').value.trim(),bolum=document.getElementById('ca-profile-department').value.trim(),sinif=document.getElementById('ca-profile-year').value.trim();
 if(ad.split(' ').filter(Boolean).length<2){status.textContent='Ad ve soyadını birlikte yazmalısın.';return}
 if(egitimDurumu==='öğrenci'&&(!universite||!bolum||!sinif)){status.textContent='Öğrenciysen üniversite, bölüm ve sınıf bilgilerini doldur.';return}
 if(email&&email!==user?.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){status.textContent='Geçerli bir e-posta adresi yaz.';return}
 status.textContent='Kaydediliyor…';const btn=ev.submitter;if(btn)btn.disabled=true;
 try{
  let pendingEmail='';
  if(email&&email!==user.email){if(!FB?.au?.verifyBeforeUpdateEmail)throw new Error('E-posta değiştirme şu anda desteklenmiyor.');await FB.au.verifyBeforeUpdateEmail(user,email);pendingEmail=email}
  const current=await caProfileGet(true),photoURL=CA_PROFILE_DRAFT_PHOTO!==null?CA_PROFILE_DRAFT_PHOTO:(CA_PROFILE_REMOVE_PHOTO?'':current.photoURL||'');
  const d=await caProfileApi('saveProfile',{ad,universite,bolum,sinif,egitimDurumu,photoURL,pendingEmail});
  CA_PROFILE_CACHE=d.profile||{};CA_PROFILE_CACHE_AT=Date.now();status.textContent=pendingEmail?'Profil kaydedildi. E-posta değişikliği için doğrulama bağlantısı gönderdik.':'Profilin başarıyla kaydedildi.';
  toast(pendingEmail?'Profil kaydedildi. Yeni e-postanı doğrula.':'Profilin güncellendi.');setTimeout(()=>render(),650);
 }catch(x){const raw=String(x?.message||'');const friendly=/Document name|FIRESTORE|Firestore|FirebaseError/i.test(raw)?'Profil kaydedilemedi. Bağlantını kontrol edip tekrar dene.':raw||'Profil bilgileri kaydedilemedi.';status.textContent=friendly;toast(friendly)}
 finally{if(btn)btn.disabled=false}
}
Object.assign(window,{profilePage,caProfileGet,caProfileAvatar,caProfilePhotoChanged,caProfileRemovePhoto,caProfileEducationChanged,caProfileCopyId,caProfileSave});
