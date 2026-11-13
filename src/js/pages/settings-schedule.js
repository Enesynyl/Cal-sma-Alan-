/* ---- Ayarlar ---- */
async function settings(L){
 return `<div class="card"><h3>Çalışma alanı</h3><label>Ad<input value="${e(W.name)}" onchange="upd({name:this.value})"></label>
 <h3>Görünüm</h3><div class="row" style="justify-content:flex-start;flex-wrap:wrap;align-items:center"><span class="m" style="font-size:13px">Vurgu rengi: Midnight Glass mavi</span><select style="width:auto;margin:0" onchange="upd({icon:this.value})">${['','🏠','🎓','🏢','🛒','🍽️','🏨','🏭','🏫','🏥','💼','🎯','🚀','🌿'].map(x=>`<option value="${x}"${(W.icon||'')===x?' selected':''}>${x||'Varsayılan ikon'}</option>`).join('')}</select><select style="width:auto;margin:0" onchange="setTheme(this.value)">${[['','Tema: otomatik'],['light','Açık tema'],['dark','Koyu tema']].map(x=>`<option value="${x[0]}"${(document.documentElement.dataset.theme||'')===x[0]?' selected':''}>${x[1]}</option>`).join('')}</select><button onclick="upd({icon:''})">Sıfırla</button></div>
 <h3>Modüller (aç/kapat, yeniden adlandır, sırala)</h3>${[...W.mods.filter(k=>AV.ogr.includes(k)),...AV.ogr.filter(k=>!W.mods.includes(k))].map(k=>{const on=W.mods.includes(k);return `<div class="chk"><input type="checkbox" ${on?'checked':''} onchange="tog('${k}',this.checked)"><input value="${e(W.icons?.[k]||'')}" placeholder="${M[k][0]}" onchange="ri('${k}',this.value)" style="width:52px;margin:0;text-align:center;flex:none"><input value="${e(W.names?.[k]||'')}" placeholder="${M[k][1]}" onchange="rn('${k}',this.value)" style="margin:0;flex:1;width:auto">${on?`<button onclick="mv('${k}',-1)">▲</button><button onclick="mv('${k}',1)">▼</button>`:''}</div>`}).join('')}
 <h3>Özel alanlar</h3><p class="m">Herhangi bir kayda kendi alanınızı ekleyin (örn. Ders → Dönem).</p><div class="row" style="justify-content:flex-start;flex-wrap:wrap"><select id="xt" style="width:auto;margin:0">${AV.ogr.filter(k=>T[k]).map(k=>`<option value="${k}">${T[k].n}</option>`).join('')}</select><input id="xl" placeholder="Alan adı" style="width:auto;margin:0"><select id="xy" style="width:auto;margin:0"><option value="text">Metin</option><option value="number">Sayı</option><option value="date">Tarih</option><option value="sel">Seçim</option></select><input id="xo" placeholder="Seçenekler: a,b,c" style="width:auto;margin:0"><button class="p" onclick="addF()">Ekle</button></div>${Object.entries(W.extra||{}).flatMap(([t,l])=>l.map(f=>`<div class="chk"><span>${T[t].n}: <b>${e(f[1])}</b></span><button onclick="delF('${t}','${f[0]}')">🗑️</button></div>`)).join('')}</div>
 <div class="card"><h3>Veri</h3><p class="m">Verilerin hesabınla otomatik eşitlenir.</p><div class="row" style="justify-content:flex-start;flex-wrap:wrap"><button onclick="pin()">🔒 PIN kilidi</button><button onclick="ask('Tüm verileriniz silinsin mi?',dws)">Tüm verileri sil</button><button onclick="cikis()">🚪 Çıkış yap</button></div></div>`;
}
async function upd(o){W={...W,...o};await put('ws',W);render()}
const tog=(k,c)=>upd({mods:c?[...W.mods,k]:W.mods.filter(x=>x!==k)});
async function dws(){for(const r of await recs(W.id))await del('rec',r.id);await del('ws',W.id);dlg();const L=await all('ws');if(!L.length){W=null;WZ={};return wz()}W=L[0];cur.m=null;render()}
async function bk(){
 const j=JSON.stringify({ws:W,rec:await recs(W.id)});
 dlg(`<h3>Yedek</h3><p class="m">Metni kopyalayıp saklayın. Geri yüklemek için aşağıya yapıştırıp “Yükle”ye basın.</p><textarea id="bt" style="min-height:140px">${e(j)}</textarea><div class="row"><button onclick="dlg()">Kapat</button><button class="p" onclick="ld()">Yükle</button></div>`);
}
const hs=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode('ca'+s)))].map(b=>b.toString(16).padStart(2,'0')).join('');
function lock(h){$('app').innerHTML=`<div class="wz"><h1>🔒 Kilitli</h1><label>PIN<input id="pn" type="password" inputmode="numeric"></label><div class="row"><button class="p" onclick="unl('${h}')">Aç</button></div></div>`}
async function unl(h){if(await hs($('pn').value)===h)boot();else{$('pn').value='';$('pn').placeholder='Yanlış PIN'}}
async function pin(){const h=await P(tx('meta').get('pin'));dlg(`<h3>Uygulama kilidi</h3><p class="m">Yerel bir ekran kilididir; verileri şifrelemez.</p><label>Yeni PIN (en az 4 hane)<input id="np" type="password" inputmode="numeric"></label><div class="row">${h?'<button onclick="np0()">Kilidi kaldır</button>':''}<button class="p" onclick="np1()">Kaydet</button></div>`)}
const np1=async()=>{const v=$('np').value;if(v.length<4){$('np').placeholder='En az 4 hane';return}await put('meta',{k:'pin',v:await hs(v)});dlg()};
const np0=async()=>{await del('meta','pin');dlg()};
async function ay(){
 const a=await recs(W.id),ev={},dk={gorev:'son',odev:'son',sinav:'tarih',takvim:'tarih'};
 a.forEach(r=>{const k=dk[r.type];if(k&&r[k])(ev[r[k]]??=[]).push(ttl(r.type,r))});
 const m=cur.mo||(cur.mo=new Date(new Date().getFullYear(),new Date().getMonth(),1)),s=mon(m),cs=[...Array(42)].map((_,i)=>{const d=new Date(s);d.setDate(s.getDate()+i);return d});
 return `<div class="bar"><button onclick="mo(-1)">‹</button><b>${m.toLocaleDateString('tr-TR',{month:'long',year:'numeric'})}</b><button onclick="mo(1)">›</button></div><p class="m">Görev, ödev, sınav ve etkinlikler birlikte gösterilir.</p><div class="cal">${['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'].map(x=>`<i>${x}</i>`).join('')}${cs.map(d=>{const k=iso(d),v=ev[k]||[];return `<div class="${d.getMonth()!==m.getMonth()?'o':''}${k===iso(new Date())?' td':''}"><b>${d.getDate()}</b>${v.slice(0,3).map(x=>`<span>${e(x)}</span>`).join('')}${v.length>3?`<span>+${v.length-3}</span>`:''}</div>`}).join('')}</div>`}
const mo=n=>{cur.mo=new Date(cur.mo.getFullYear(),cur.mo.getMonth()+n,1);render()};
async function nxt(r){
 if(!r.tekrar||!r.son)return;
 const d=new Date(r.son+'T12:00:00');
 if(r.tekrar==='Her gün')d.setDate(d.getDate()+1);
 else if(r.tekrar==='Hafta içi'){do{d.setDate(d.getDate()+1)}while(d.getDay()===0||d.getDay()===6)}
 else if(r.tekrar==='Hafta sonu'){do{d.setDate(d.getDate()+1)}while(d.getDay()!==0&&d.getDay()!==6)}
 else if(r.tekrar==='Her hafta')d.setDate(d.getDate()+7);
 else if(r.tekrar==='Her ay')d.setMonth(d.getMonth()+1);
 else return;
 await put('rec',{...r,id:uid(),son:iso(d),durum:'Bekliyor',ts:Date.now()});
}
async function done(id){
 const r=await P(tx('rec').get(id));if(!r)return;
 r.durum='Tamamlandı';r.completedAt=taskToday();r.completedTime=new Date().toISOString();
 await put('rec',r);await nxt(r);render();
}


/* ---- Midnight Tasks: task center, history, quick actions and progress ---- */
const taskToday=()=>iso(new Date());
const taskDateLabel=v=>{if(!v)return 'Tarih belirlenmedi';const d=new Date(v+'T12:00:00');return d.toLocaleDateString('tr-TR',{day:'numeric',month:'short',year:'numeric'})};
const taskOpen=r=>r.durum!=='Tamamlandı'&&r.durum!=='İptal edildi';
const taskPriority=r=>r.oncelik||'Orta';
async function taskCenter(){
 const allTasks=(await recs(W.id,'gorev')).sort((a,b)=>((a.son||'9999')+(a.saat||'')).localeCompare((b.son||'9999')+(b.saat||'')));
 const today=taskToday(),active=allTasks.filter(taskOpen),completed=allTasks.filter(r=>r.durum==='Tamamlandı');
 const overdue=active.filter(r=>r.son&&r.son<today),dueToday=active.filter(r=>!r.son||r.son===today),upcoming=active.filter(r=>r.son>today),repeating=active.filter(r=>r.tekrar);
 const weekStart=new Date();weekStart.setDate(weekStart.getDate()-6);weekStart.setHours(0,0,0,0);
 const weekDone=completed.filter(r=>r.completedAt&&new Date(r.completedAt+'T12:00:00')>=weekStart).length;
 const pct=active.length+completed.length?Math.round(completed.length/(active.length+completed.length)*100):0;
 const tabs=[['today','Bugün',dueToday.length],['upcoming','Yaklaşan',upcoming.length],['overdue','Geciken',overdue.length],['repeat','Tekrarlanan',repeating.length],['done','Tamamlanan',completed.length]];
 if(!cur.taskTab)cur.taskTab='today';
 const tab=cur.taskTab;
 let rows=tab==='today'?dueToday:tab==='upcoming'?upcoming:tab==='overdue'?overdue:tab==='repeat'?repeating:completed;
 if(tab==='done')rows=rows.sort((a,b)=>(b.completedAt||'').localeCompare(a.completedAt||''));
 const cards=rows.map(r=>{
  const late=taskOpen(r)&&r.son&&r.son<today;
  const meta=[r.son?taskDateLabel(r.son):'Tarih yok',r.saat||'',taskPriority(r)+' öncelik',r.tekrar?'↻ '+r.tekrar:''].filter(Boolean).join(' · ');
  return `<article class="task-card ${late?'is-overdue':''} ${r.durum==='Tamamlandı'?'is-complete':''}">
   <button class="task-check ${r.durum==='Tamamlandı'?'checked':''}" aria-label="${r.durum==='Tamamlandı'?'Tamamlanmadı olarak işaretle':'Görevi tamamla'}" onclick="${r.durum==='Tamamlandı'?'taskReopen':'taskComplete'}('${r.id}')">${r.durum==='Tamamlandı'?'✓':''}</button>
   <div class="task-card-main"><b>${e(ttl('gorev',r))}</b><small>${e(meta)}</small>${r.not?`<p>${e(r.not)}</p>`:''}
    <div class="task-card-actions">${r.durum==='Tamamlandı'?'<span class="task-completed-label">✓ Tamamlandı</span>':`<button onclick="taskSnooze('${r.id}','30m')">30 dk</button><button onclick="taskSnooze('${r.id}','1h')">1 saat</button><button onclick="taskSnooze('${r.id}','tomorrow')">Yarına</button><button onclick="taskEdit('${r.id}')">Düzenle</button>`}${r.durum==='Tamamlandı'?`<button onclick="taskEdit('${r.id}')">Detay</button>`:''}</div>
   </div>
   <span class="task-priority p-${taskPriority(r)==='Yüksek'?'high':taskPriority(r)==='Düşük'?'low':'medium'}">${taskPriority(r)}</span>
  </article>`;
 }).join('');
 const title=({today:'Bugünkü görevlerin',upcoming:'Yaklaşan görevlerin',overdue:'Geciken görevlerin',repeat:'Tekrarlanan görevlerin',done:'Tamamlanan görev arşivi'})[tab];
 return `<section class="task-center">
  <header class="task-heading"><div><span class="task-eyebrow">MIDNIGHT TASKS</span><h1>Görev Merkezi</h1><p class="m">Planla, tamamla ve ilerlemeni takip et.</p></div><button class="p task-add" onclick="taskEdit()">＋ Görev ekle</button></header>
  <div class="task-overview"><div class="task-progress-card"><div class="task-progress-top"><span>Genel ilerleme</span><b>%${pct}</b></div><div class="task-progress-track"><i style="width:${pct}%"></i></div><small>${completed.length} tamamlandı · ${active.length} aktif görev</small></div>
   <div class="task-stat"><small>Bugün biten</small><b>${completed.filter(r=>r.completedAt===today).length}</b></div>
   <div class="task-stat"><small>Son 7 gün</small><b>${weekDone}</b></div>
  </div>
  <div class="task-tabs">${tabs.map(([id,label,n])=>`<button class="${tab===id?'active':''}" onclick="cur.taskTab='${id}';render()"><span>${label}</span><b>${n}</b></button>`).join('')}</div>
  <div class="task-list-head"><h2>${title}</h2><span>${rows.length} kayıt</span></div>
  <div class="task-list">${cards||`<div class="task-empty"><span>${tab==='done'?'✦':'☀️'}</span><b>${tab==='done'?'Henüz tamamlanan görev yok.':tab==='overdue'?'Geciken görevin yok.':'Burada şimdilik görev yok.'}</b><small>${tab==='today'?'Yeni bir görev ekleyerek başlayabilirsin.':'Görevlerin geldikçe burada görünecek.'}</small>${tab==='today'?'<button class="p" onclick="taskEdit()">＋ İlk görevini ekle</button>':''}</div>`}</div>
 </section>`;
}
function taskEditForm(r){
 const x=r||{},rep=['Yok','Her gün','Hafta içi','Hafta sonu','Her hafta','Her ay'];
 dlg(`<div class="task-form"><div class="task-form-head"><div><span class="task-eyebrow">GÖREV DETAYI</span><h2>${r?'Görevi düzenle':'Yeni görev oluştur'}</h2></div><button onclick="dlg()">✕</button></div>
 <label>Görev adı<input id="taskName" maxlength="120" value="${e(x.ad||'')}" placeholder="Örn. İngilizce çalış"></label>
 <div class="task-form-grid"><label>Tarih<input id="taskDate" type="date" value="${e(x.son||taskToday())}"></label><label>Saat<input id="taskTime" type="time" value="${e(x.saat||'')}"></label></div>
 <div class="task-form-grid"><label>Öncelik<select id="taskPriority">${['Düşük','Orta','Yüksek'].map(v=>`<option ${(x.oncelik||'Orta')===v?'selected':''}>${v}</option>`).join('')}</select></label><label>Tekrar<select id="taskRepeat">${rep.map(v=>`<option ${(x.tekrar||'Yok')===v?'selected':''}>${v}</option>`).join('')}</select></label></div>
 <label>Not / açıklama<textarea id="taskNote" rows="3" maxlength="1000" placeholder="Bu görevle ilgili ayrıntılar…">${e(x.not||'')}</textarea></label>
 <div class="row"><button onclick="dlg()">Vazgeç</button><button class="p" onclick="taskSave('${x.id||''}')">Kaydet</button></div>
 ${r?`<div class="task-delete-row"><button onclick="taskDelete('${r.id}')">Görevi sil</button></div>`:''}</div>`);
}
async function taskSave(id){
 const ad=$('taskName')?.value.trim();if(!ad){toast('Görev adını yazmalısın');$('taskName')?.focus();return}
 const old=id?await P(tx('rec').get(id)):null,repeat=$('taskRepeat').value;
 const r={...(old||{}),id:id||uid(),ws:W.id,type:'gorev',ad,son:$('taskDate').value,saat:$('taskTime').value,oncelik:$('taskPriority').value,tekrar:repeat==='Yok'?'':repeat,not:$('taskNote').value.trim(),durum:old?.durum||'Bekliyor',ts:old?.ts||Date.now()};
 await put('rec',r);dlg();cur.taskTab='today';render();toast(id?'Görev güncellendi':'Görev eklendi');
}
async function taskEdit(id){const r=id?await P(tx('rec').get(id)):null;taskEditForm(r)}
async function taskComplete(id){const r=await P(tx('rec').get(id));if(!r)return;r.durum='Tamamlandı';r.completedAt=taskToday();r.completedTime=new Date().toISOString();await put('rec',r);await nxt(r);render();toast('Görev tamamlandı ✨')}
async function taskReopen(id){const r=await P(tx('rec').get(id));if(!r)return;r.durum='Bekliyor';delete r.completedAt;delete r.completedTime;await put('rec',r);render();toast('Görev yeniden aktif')}
async function taskSnooze(id,mode){
 const r=await P(tx('rec').get(id));if(!r)return;
 const d=mode==='tomorrow'?new Date((r.son||taskToday())+'T12:00:00'):new Date();
 if(mode==='30m')d.setMinutes(d.getMinutes()+30);
 else if(mode==='1h')d.setHours(d.getHours()+1);
 else d.setDate(d.getDate()+1);
 r.son=iso(d);
 if(mode==='30m'||mode==='1h')r.saat=String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
 r.durum='Bekliyor';await put('rec',r);render();toast(mode==='tomorrow'?'Görev yarına ertelendi':'Görev ertelendi');
}
async function taskDelete(id){if(!confirm('Bu görev kalıcı olarak silinsin mi?'))return;await del('rec',id);dlg();render();toast('Görev silindi')}
