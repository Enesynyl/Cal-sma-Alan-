/* ---- Üniversite kullanıcı girişi (OBİS) + çıkış ---- */
const OBIS='https://obis.nisantasi.edu.tr/';
function uniObis(){const b=$('un');if(!b)return;
 b.innerHTML=`<div class="card"><h3>🔑 Üniversite kullanıcı girişi (OBİS)</h3><div class="row" style="justify-content:flex-start;flex-wrap:wrap;gap:8px"><button class="p" onclick="location.href=OBIS">➡️ Bu sekmede aç</button><button onclick="window.open(OBIS,'_blank','noopener')">↗️ Yeni sekmede aç</button></div></div>`}
function cikis(){if(!(FB&&FB.user)){toast('Bulut hesabına giriş yapılmamış');return fbUi()}
 ask('Çıkış yapılsın mı? Son değişikliklerin buluta gönderilir, bu cihazdaki veriler temizlenir.',()=>{dlg();fbAct('out')})}

function uniCal(){const b=$('un');if(!b||!W.uni)return;const u=W.uni,n=new Date(),y=n.getMonth()>=6?n.getFullYear():n.getFullYear()-1;
 b.innerHTML=`<div class="card"><h3>📅 ${e(uniFull(u))} akademik takvimi</h3><p class="m">Resmî takvim bu sekmede görüntülenir.</p><div id="ucbody">${u.d==='nisantasi.edu.tr'?'<h3>2026–2027 Lisans ve Ön Lisans Akademik Takvimi</h3><iframe title="Resmî akademik takvim" src="https://www.nisantasi.edu.tr/akademik-takvim?dil=tr" style="width:100%;height:75vh;border:1px solid var(--bd);border-radius:12px;background:white"></iframe><p><a target="_blank" rel="noopener" href="https://www.nisantasi.edu.tr/Images/AkademikTakvimYillar/2026-2027-egitim-ogretim-yili-akademik-takvimi-icin-tiklayiniz_67956.pdf">PDF’yi yeni sekmede aç</a></p>':'<div class="empty">Üniversitenin resmî akademik takvimi aranıyor…</div>'}</div></div>`;
 if(u.d!=='nisantasi.edu.tr')uniCalLoad(y)}
