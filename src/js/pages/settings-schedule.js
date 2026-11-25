/* ---- Ayarlar ---- */
async function settings(L){
 return `<div class="card"><h3>Veri</h3><p class="m">Verilerin hesabınla otomatik eşitlenir.</p><div class="row" style="justify-content:flex-start;flex-wrap:wrap"><button onclick="pin()">🔒 PIN kilidi</button><button onclick="ask('Tüm verileriniz silinsin mi?',dws)">Tüm verileri sil</button><button onclick="cikis()">🚪 Çıkış yap</button></div></div>`;
}
async function setTheme(){document.documentElement.dataset.theme="midnight";document.documentElement.style.colorScheme="dark";}
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


/* ---- Akademik Ödev Merkezi ---- */
const hwToday=()=>iso(new Date());
const hwOpen=r=>!['Tamamlandı','İptal edildi'].includes(r.durum)&&!r.archived;
const hwDateLabel=v=>{if(!v)return 'Tarih belirlenmedi';const d=new Date(v+'T12:00:00');return d.toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric'})};
const hwPriority=r=>r.oncelik||'Orta';
const hwChecklist=r=>Array.isArray(r.checklist)?r.checklist:[];
const hwPct=r=>{const a=hwChecklist(r);return a.length?Math.round(a.filter(x=>x.done).length/a.length*100):0};
const hwLinks=r=>Array.isArray(r.links)?r.links:[];
let hwTicker=null;
async function homeworkCenter(){
 const all=(await recs(W.id,'odev')).sort((a,b)=>((a.son||'9999')+(a.saat||'')).localeCompare((b.son||'9999')+(b.saat||'')));
 const today=hwToday(),active=all.filter(hwOpen),completed=all.filter(r=>r.durum==='Tamamlandı'&&!r.archived),archived=all.filter(r=>r.archived),overdue=active.filter(r=>r.son&&r.son<today),dueToday=active.filter(r=>r.son===today),upcoming=active.filter(r=>r.son>today),weekEnd=iso(new Date(Date.now()+7*864e5)),week=active.filter(r=>r.son&&r.son>=today&&r.son<=weekEnd);
 const total=all.filter(r=>!r.archived),done=total.filter(r=>r.durum==='Tamamlandı'),pct=total.length?Math.round(done.length/total.length*100):0;
 const tabs=[['overview','Genel bakış'],['all','Tüm ödevler'],['calendar','Takvim'],['completed','Tamamlanan'],['archive','Arşiv']];
 if(!cur.hwTab)cur.hwTab='overview';const tab=cur.hwTab;
 const search=(cur.hwSearch||'').toLocaleLowerCase('tr'),sort=cur.hwSort||'date';
 let rows=tab==='all'?total.filter(r=>!r.archived):tab==='completed'?completed:tab==='archive'?archived:tab==='overview'?[...overdue,...dueToday,...week.filter(x=>!dueToday.includes(x)&&!overdue.includes(x))]:[];
 rows=rows.filter(r=>!search||[r.ad,r.ders,r.aciklama].join(' ').toLocaleLowerCase('tr').includes(search));
 rows.sort((a,b)=>sort==='priority'?({'Yüksek':0,'Orta':1,'Düşük':2}[hwPriority(a)]-({'Yüksek':0,'Orta':1,'Düşük':2}[hwPriority(b)])):((a.son||'9999')+(a.saat||'')).localeCompare((b.son||'9999')+(b.saat||'')));
 const cards=rows.map(r=>{
  const late=hwOpen(r)&&r.son&&r.son<today,subs=hwChecklist(r),progress=hwPct(r),links=hwLinks(r),secs=Number(r.studySeconds)||0;
  const elapsed=secs+(r.studyStartedAt?Math.max(0,Math.floor((Date.now()-r.studyStartedAt)/1000)):0);
  const time=String(Math.floor(elapsed/3600)).padStart(2,'0')+':'+String(Math.floor(elapsed%3600/60)).padStart(2,'0')+':'+String(elapsed%60).padStart(2,'0');
  return `<article class="hw-card ${late?'is-late':''} ${r.durum==='Tamamlandı'?'is-done':''}">
   <div class="hw-card-top"><span class="hw-subject">${e(r.ders||'Ders belirtilmedi')}</span><span class="hw-priority p-${hwPriority(r)==='Yüksek'?'high':hwPriority(r)==='Düşük'?'low':'medium'}">${e(hwPriority(r))}</span></div>
   <div class="hw-card-title"><button class="hw-check ${r.durum==='Tamamlandı'?'checked':''}" onclick="hwComplete('${r.id}')">${r.durum==='Tamamlandı'?'✓':''}</button><div><h3>${e(r.ad)}</h3><small>${r.son?'📅 '+e(hwDateLabel(r.son)):'Tarih belirlenmedi'} ${r.saat?'· '+e(r.saat):''} ${late?'· Süresi geçti':''}</small></div><button class="hw-edit" onclick="hwEdit('${r.id}')">Düzenle</button></div>
   ${r.aciklama?'<p class="hw-desc">'+e(r.aciklama)+'</p>':''}
   ${subs.length?`<div class="hw-subtasks"><div class="hw-subtask-head"><b>Alt görevler</b><small>%${progress}</small></div><div class="hw-progress"><i style="width:${progress}%"></i></div>${subs.map((x,i)=>`<label class="hw-subtask"><input type="checkbox" ${x.done?'checked':''} onchange="hwToggleSub('${r.id}',${i},this.checked)"><span class="${x.done?'is-checked':''}">${e(x.text)}</span></label>`).join('')}</div>`:''}
   ${links.length?'<div class="hw-links">'+links.map((x,i)=>'<a href="'+e(x.url)+'" target="_blank" rel="noopener noreferrer">↗ '+e(x.name||('Ek '+(i+1)))+'</a>').join('')+'</div>':''}${(r.attachments||[]).length?'<div class="hw-links">'+r.attachments.map(a=>'<a href="'+a.data+'" download="'+e(a.name)+'">📎 '+e(a.name)+'</a>').join('')+'</div>':''}
   <div class="hw-card-footer"><div class="hw-timer"><b data-hw-time="${r.id}">${time}</b><small>Çalışma süresi</small></div><div class="hw-actions">${r.durum==='Tamamlandı'?'<button onclick="hwReopen(\''+r.id+'\')">Yeniden aç</button>':`<button class="${r.studyStartedAt?'is-running':''}" onclick="hwTimer('${r.id}')">${r.studyStartedAt?'⏸ Durdur':'▶ Çalış'}</button>`}<button onclick="hwEdit('${r.id}')">Detay</button>${r.archived?'<button onclick="hwArchive(\''+r.id+'\',false)">Arşivden çıkar</button>':'<button onclick="hwArchive(\''+r.id+'\',true)">Arşivle</button>'}</div></div>
  </article>`;
 }).join('');
 let body='';
 if(tab==='calendar'){
  const month=cur.hwMonth?new Date(cur.hwMonth):new Date(new Date().getFullYear(),new Date().getMonth(),1),first=new Date(month.getFullYear(),month.getMonth(),1),start=new Date(first);start.setDate(first.getDate()-((first.getDay()+6)%7));
  const days=Array.from({length:42},(_,i)=>{const d=new Date(start);d.setDate(start.getDate()+i);const key=iso(d),items=active.filter(r=>r.son===key);return `<button class="hw-cal-day ${d.getMonth()!==month.getMonth()?'outside':''} ${key===today?'today':''} ${items.length?'has-items':''}" onclick="cur.hwSelected='${key}';render()"><b>${d.getDate()}</b><small>${items.length?items.length+' ödev':''}</small></button>`}).join('');
  const selected=cur.hwSelected||today,sel=active.filter(r=>r.son===selected);
  body=`<div class="hw-calendar"><div class="hw-cal-head"><button onclick="hwMonth(-1)">‹</button><b>${month.toLocaleDateString('tr-TR',{month:'long',year:'numeric'})}</b><button onclick="hwMonth(1)">›</button></div><div class="hw-weekdays">${['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'].map(x=>'<span>'+x+'</span>').join('')}</div><div class="hw-cal-grid">${days}</div><h3>${hwDateLabel(selected)} · ${sel.length} ödev</h3>${sel.length?sel.map(r=>'<div class="hw-mini-row"><b>'+e(r.ad)+'</b><small>'+e(r.saat||'')+' · '+e(r.ders||'')+'</small><button onclick="hwEdit(\''+r.id+'\')">Aç</button></div>').join(''):'<p class="m">Bu tarihte teslim edilecek ödev yok.</p>'}</div>`;
 }else if(tab==='overview'){
  const groups=[['Geciken',overdue],['Bugün teslim',dueToday],['Önümüzdeki 7 gün',week.filter(x=>!overdue.includes(x))]],smartPlan=[...active].sort((a,b)=>{const rank=x=>x.son&&x.son<today?0:x.son===today?1:x.son&&x.son<=weekEnd?2:3;return rank(a)-rank(b)||({'Yüksek':0,'Orta':1,'Düşük':2}[hwPriority(a)]-({'Yüksek':0,'Orta':1,'Düşük':2}[hwPriority(b)]))}).slice(0,3);
  body='<section class="hw-group"><header><b>✨ Bugünün akıllı çalışma planı</b><span>'+smartPlan.length+' adım</span></header>'+(smartPlan.length?smartPlan.map((r,i)=>'<div class="hw-overview-row"><span>'+(i+1)+'. '+e(r.ad)+'</span><small>'+e(r.son?hwDateLabel(r.son):'Tarih yok')+' · '+e(hwPriority(r))+'</small></div>').join(''):'<p class="m">Plan oluşturmak için önce bir ödev ekle.</p>')+'</section>'+groups.map(([title,items])=>`<section class="hw-group"><header><b>${title}</b><span>${items.length}</span></header>${items.length?items.slice(0,5).map(r=>'<button class="hw-overview-row" onclick="hwEdit(\''+r.id+'\')"><span>'+e(r.ad)+'</span><small>'+e(r.son||'')+' '+e(r.saat||'')+'</small></button>').join(''):'<p class="m">Bu bölümde ödev yok.</p>'}</section>`).join('')+`<section class="hw-group"><header><b>Son tamamlananlar</b><span>${completed.length}</span></header>${completed.slice(-3).reverse().map(r=>'<div class="hw-overview-row"><span>✓ '+e(r.ad)+'</span><small>'+e(r.ders||'')+'</small></div>').join('')||'<p class="m">Henüz tamamlanan ödev yok.</p>'}</section>`;
 }else body=`<div class="hw-list-tools"><input aria-label="Ödev ara" id="hwSearchInput" placeholder="Ödev veya ders ara…" value="${e(cur.hwSearch||'')}" oninput="cur.hwSearch=this.value;hwRefreshList()"><select aria-label="Sıralama" onchange="cur.hwSort=this.value;render()"><option value="date" ${sort==='date'?'selected':''}>Teslim tarihine göre</option><option value="priority" ${sort==='priority'?'selected':''}>Önceliğe göre</option></select></div>${cards||'<div class="hw-empty"><span>📚</span><b>Burada henüz ödev yok.</b><small>İlk ödevini ekleyerek başlayabilirsin.</small><button class="p" onclick="hwEdit()">＋ İlk ödevini ekle</button></div>'}`;
 clearInterval(hwTicker);if(active.some(r=>r.studyStartedAt)){hwTicker=setInterval(()=>{document.querySelectorAll('[data-hw-time]').forEach(el=>{const r=all.find(x=>x.id===el.dataset.hwTime);if(!r)return;const n=(Number(r.studySeconds)||0)+Math.max(0,Math.floor((Date.now()-r.studyStartedAt)/1000));el.textContent=String(Math.floor(n/3600)).padStart(2,'0')+':'+String(Math.floor(n%3600/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0')})},1000)}
 return `<section class="hw-center"><header class="hw-heading"><div><span class="hw-eyebrow">ACADEMIC PLANNER</span><h1>Ödev Merkezi</h1><p class="m">Teslim tarihlerini, çalışma adımlarını ve ilerlemeni tek yerden yönet.</p></div><button class="p" onclick="hwEdit()">＋ Ödev ekle</button></header>
 <div class="hw-stats"><div><small>Toplam ödev</small><b>${total.length}</b></div><div><small>Bekleyen</small><b>${active.filter(r=>r.durum==='Bekliyor'||!r.durum).length}</b></div><div><small>Devam eden</small><b>${active.filter(r=>r.durum==='Devam ediyor').length}</b></div><div><small>Tamamlanan</small><b>${done.length}</b></div><div class="late"><small>Süresi geçen</small><b>${overdue.length}</b></div></div>
 <div class="hw-overall"><div><span>Genel tamamlanma</span><b>%${pct}</b></div><div class="hw-progress"><i style="width:${pct}%"></i></div></div>
 <nav class="hw-tabs">${tabs.map(([id,label])=>'<button class="'+(tab===id?'active':'')+'" onclick="cur.hwTab=\''+id+'\';render()">'+label+(id==='all'?' · '+active.length:id==='completed'?' · '+completed.length:id==='archive'?' · '+archived.length:'')+'</button>').join('')}</nav>
 ${body}</section>`;
}
let hwSearchTimer=null;function hwRefreshList(){clearTimeout(hwSearchTimer);const input=$('hwSearchInput'),pos=input?.selectionStart??0;hwSearchTimer=setTimeout(()=>homeworkCenter().then(html=>{const root=document.querySelector('.hw-center');if(!root)return;root.outerHTML=html;const next=$('hwSearchInput');if(next){next.focus();next.setSelectionRange(pos,pos)}}),140)}
function hwMonth(n){const m=cur.hwMonth?new Date(cur.hwMonth):new Date();cur.hwMonth=new Date(m.getFullYear(),m.getMonth()+n,1);render()}
async function hwEdit(id){
 const r=id?await P(tx('rec').get(id)):null;if(r&&r.type!=='odev')return;
 const courses=await recs(W.id,'ders'),x=r||{},subs=hwChecklist(x),links=hwLinks(x);
 hwReminderDraft=Array.isArray(x.reminderOffsets)?x.reminderOffsets.map(Number).filter(v=>v>0):((x.reminders||[]).map(v=>({ '1d':1440,'3h':180,'1h':60,'15m':15 }[v])).filter(Boolean));
 dlg(`<div class="hw-form"><header><div><span class="hw-eyebrow">ÖDEV DETAYI</span><h2>${r?'Ödevi düzenle':'Yeni ödev oluştur'}</h2></div><button onclick="dlg()">×</button></header>
 <label>Ödev başlığı<input id="hwName" maxlength="140" value="${e(x.ad||'')}" placeholder="Örn. Biyoloji araştırma ödevi"></label>
 <div class="hw-form-grid"><label>Ders<select id="hwCourse"><option value="">Ders seç (isteğe bağlı)</option>${courses.map(c=>'<option '+(x.ders===c.ad?'selected':'')+'>'+e(c.ad)+'</option>').join('')}</select></label><label>Öncelik<select id="hwPriority">${['Düşük','Orta','Yüksek'].map(v=>'<option '+(hwPriority(x)===v?'selected':'')+'>'+v+'</option>').join('')}</select></label></div>
 <div class="hw-form-grid"><label>Son teslim tarihi<input id="hwDate" type="date" value="${e(x.son||'')}"></label><label>Saat<input id="hwTime" type="time" value="${e(x.saat||'23:59')}"></label></div>
 <div class="hw-form-grid"><label>Tahmini süre (dakika)<input id="hwEstimate" type="number" min="0" max="10000" value="${e(x.estimate||'')}" placeholder="Örn. 90"></label><label>Durum<select id="hwStatus">${['Bekliyor','Devam ediyor','Tamamlandı','İptal edildi'].map(v=>'<option '+((x.durum||'Bekliyor')===v?'selected':'')+'>'+v+'</option>').join('')}</select></label></div>
 <label>Açıklama<textarea id="hwDesc" rows="3" maxlength="3000" placeholder="Ödevin kapsamı ve notların…">${e(x.aciklama||'')}</textarea></label>
 <label>Alt görevler <small>(Her satıra bir adım yaz)</small><textarea id="hwSubtasks" rows="4" placeholder="Konuyu araştır\nKaynakları bul\nTaslağı hazırla\nSon kontrolü yap">${e(subs.map(s=>s.text).join('\n'))}</textarea></label>
 <label>Dosya / bağlantı adresleri <small>(Her satıra bir https:// bağlantısı yaz)</small><textarea id="hwLinks" rows="2" placeholder="https://…">${e(links.map(l=>l.url).join('\n'))}</textarea></label><label>Dosya ekle <input id="hwFiles" type="file" multiple accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.txt"><small>Dosya başına en fazla 250 KB; toplam 450 KB. Mevcut ekler korunur.</small></label>${(x.attachments||[]).length?'<div class="hw-existing-files">Mevcut ekler: '+(x.attachments||[]).map(a=>e(a.name)).join(' · ')+'</div>':''}
 <div class="hw-reminders hw-reminder-editor"><b>🔔 Hatırlatma zamanlarını kendin belirle</b><div class="hw-reminder-add"><input id="hwReminderValue" type="number" min="1" max="9999" value="30" aria-label="Hatırlatma miktarı"><select id="hwReminderUnit" aria-label="Zaman birimi"><option value="1">Dakika önce</option><option value="60">Saat önce</option><option value="1440">Gün önce</option><option value="10080">Hafta önce</option></select><button type="button" onclick="hwAddReminder()">＋ Ekle</button></div><div id="hwReminderChips" class="hw-reminder-chips"></div><small>Birden fazla hatırlatma ekleyebilirsin. İstemediğini × ile kaldır.</small></div>
 <div class="row"><button onclick="dlg()">Vazgeç</button><button class="p" onclick="hwSave('${x.id||''}')">Kaydet</button></div>${r?'<div class="hw-delete"><button onclick="hwDelete(\''+r.id+'\')">Ödevi sil</button></div>':''}</div>`);
 hwRenderReminderChips();
}
let hwReminderDraft=[];
function hwReminderLabel(mins){if(mins%10080===0)return (mins/10080)+' hafta önce';if(mins%1440===0)return (mins/1440)+' gün önce';if(mins%60===0)return (mins/60)+' saat önce';return mins+' dakika önce'}
function hwRenderReminderChips(){const box=$('hwReminderChips');if(!box)return;box.innerHTML=hwReminderDraft.map((v,i)=>'<span class="hw-reminder-chip">'+e(hwReminderLabel(v))+' <button type="button" aria-label="Hatırlatmayı kaldır" onclick="hwRemoveReminder('+i+')">×</button></span>').join('')||'<small>Henüz hatırlatma eklenmedi.</small>'}
function hwAddReminder(){const amount=Math.floor(+$('hwReminderValue')?.value),unit=+$('hwReminderUnit')?.value;if(!Number.isFinite(amount)||amount<1||amount>9999){toast('1 ile 9999 arasında bir süre gir.');return}const mins=amount*unit;if(!Number.isSafeInteger(mins)||mins<1){toast('Geçerli bir süre gir.');return}if(hwReminderDraft.includes(mins)){toast('Bu hatırlatma zaten ekli.');return}hwReminderDraft.push(mins);hwReminderDraft.sort((a,b)=>b-a);hwRenderReminderChips()}
function hwRemoveReminder(i){hwReminderDraft.splice(i,1);hwRenderReminderChips()}
async function hwSave(id){
 const ad=$('hwName')?.value.trim();if(!ad){toast('Ödev başlığını yazmalısın');$('hwName')?.focus();return}
 const old=id?await P(tx('rec').get(id)):null,reminderOffsets=[...new Set(hwReminderDraft.map(Number).filter(v=>v>0&&v<=10080*9999))].sort((a,b)=>b-a),reminders=[];
 const checklist=$('hwSubtasks').value.split('\n').map(s=>s.trim()).filter(Boolean).map(text=>({id:uid(),text,done:false}));
 const prev=hwChecklist(old||{});checklist.forEach(s=>{const p=prev.find(x=>x.text===s.text);if(p)s.done=!!p.done});
 const links=$('hwLinks').value.split('\n').map(s=>s.trim()).filter(Boolean).map((url,i)=>({url,name:'Bağlantı '+(i+1)}));
 for(const l of links){try{const u=new URL(l.url);if(!['http:','https:'].includes(u.protocol))throw 0}catch{toast('Bağlantılardan biri geçersiz. https:// ile başlayan adres kullan.');return}}
 const files=[...(old?.attachments||[])],picked=[...($('hwFiles')?.files||[])];let bytes=files.reduce((n,x)=>n+(x.size||0),0);for(const file of picked){if(file.size>250*1024||bytes+file.size>450*1024){toast('Dosyalar toplamı 450 KB sınırını aşamaz.');return}const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('Dosya okunamadı'));reader.readAsDataURL(file)});files.push({id:uid(),name:file.name,size:file.size,type:file.type||'application/octet-stream',data});bytes+=file.size}const r={...(old||{}),id:id||uid(),ws:W.id,type:'odev',ad,ders:$('hwCourse').value,son:$('hwDate').value,saat:$('hwTime').value,oncelik:$('hwPriority').value,estimate:Math.max(0,Math.min(10000,+$('hwEstimate').value||0)),durum:$('hwStatus').value,aciklama:$('hwDesc').value.trim(),checklist,links,attachments:files,reminders,reminderOffsets,studySeconds:Number(old?.studySeconds)||0,ts:old?.ts||Date.now()};
 if(old?.studyStartedAt&&r.durum!=='Tamamlandı')r.studyStartedAt=old.studyStartedAt;else if(old?.studyStartedAt){r.studySeconds+=Math.max(0,Math.floor((Date.now()-old.studyStartedAt)/1000));delete r.studyStartedAt}
 await put('rec',r);dlg();cur.hwTab='all';render();toast(id?'Ödev güncellendi':'Ödev eklendi');
}
async function hwComplete(id){const r=await P(tx('rec').get(id));if(!r)return;r.durum=r.durum==='Tamamlandı'?'Bekliyor':'Tamamlandı';if(r.durum==='Tamamlandı'){r.completedAt=hwToday();r.completedTime=new Date().toISOString();if(r.studyStartedAt){r.studySeconds=(Number(r.studySeconds)||0)+Math.max(0,Math.floor((Date.now()-r.studyStartedAt)/1000));delete r.studyStartedAt}}else{delete r.completedAt;delete r.completedTime}await put('rec',r);render();toast(r.durum==='Tamamlandı'?'Ödev tamamlandı 🎉':'Ödev yeniden açıldı')}
async function hwReopen(id){return hwComplete(id)}
async function hwToggleSub(id,i,done){const r=await P(tx('rec').get(id));if(!r)return;const a=hwChecklist(r);if(a[i])a[i].done=!!done;r.checklist=a;if(a.length&&a.every(x=>x.done))r.durum='Devam ediyor';await put('rec',r);render()}
async function hwTimer(id){const r=await P(tx('rec').get(id));if(!r)return;if(r.studyStartedAt){r.studySeconds=(Number(r.studySeconds)||0)+Math.max(0,Math.floor((Date.now()-r.studyStartedAt)/1000));delete r.studyStartedAt}else{r.studyStartedAt=Date.now();if(r.durum==='Bekliyor')r.durum='Devam ediyor'}await put('rec',r);render();toast(r.studyStartedAt?'Ödev çalışması başladı ⏱️':'Çalışma süresi kaydedildi')}
async function hwArchive(id,on){const r=await P(tx('rec').get(id));if(!r)return;r.archived=!!on;await put('rec',r);render()}
async function hwDelete(id){if(!confirm('Bu ödev kalıcı olarak silinsin mi?'))return;await del('rec',id);dlg();render();toast('Ödev silindi')}


/* ---- Akademik Sınav Merkezi ---- */
const exToday=()=>iso(new Date());
const exDate=v=>v?new Date(v+'T12:00:00').toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric'}):'Tarih belirlenmedi';
const exDays=v=>Math.ceil((new Date(v+'T12:00:00')-new Date(exToday()+'T12:00:00'))/864e5);
const exTopics=r=>Array.isArray(r.topics)?r.topics:[];
const exPlan=r=>Array.isArray(r.studyPlan)?r.studyPlan:[];
const exDone=r=>exPlan(r).filter(x=>x.done).length;
function exBuildPlan(date,topics){
 const start=new Date(exToday()+'T12:00:00'),end=new Date(date+'T12:00:00'),days=Math.max(0,Math.round((end-start)/864e5));
 if(!topics.length||days<1)return [];
 const prepDays=Math.max(1,days-1),out=[];
 topics.forEach((topic,i)=>{const offset=Math.min(prepDays-1,Math.floor(i*prepDays/topics.length)),d=new Date(start);d.setDate(d.getDate()+offset);out.push({id:uid(),date:iso(d),title:topic,done:false})});
 const last=new Date(end);last.setDate(last.getDate()-1);
 out.push({id:uid(),date:iso(last),title:'Genel tekrar ve deneme çözümü',done:false,review:true});
 return out.sort((a,b)=>a.date.localeCompare(b.date));
}
async function examCenter(){
 const all=(await recs(W.id,'sinav')).sort((a,b)=>(a.tarih||'9999').localeCompare(b.tarih||'9999'));
 const today=exToday(),active=all.filter(r=>r.tarih>=today&&!r.archived),past=all.filter(r=>r.tarih<today||r.archived),next=active[0];
 const completed=all.filter(r=>r.score!==''&&r.score!=null),avg=completed.length?completed.reduce((n,r)=>n+(Number(r.score)||0),0)/completed.length:null;
 const tabs=[['upcoming','⏳ Yaklaşan'],['all','📚 Tüm sınavlar'],['results','📊 Sonuçlar'],['past','🗂️ Geçmiş']];
 if(!cur.exTab)cur.exTab='upcoming';const tab=cur.exTab;
 let rows=tab==='upcoming'?active:tab==='results'?completed:tab==='past'?past:all;
 const cards=rows.map(r=>{
  const days=exDays(r.tarih),plan=exPlan(r),pct=plan.length?Math.round(exDone(r)/plan.length*100):0,topics=exTopics(r);
  const countdown=days<0?'Sınav geçti':days===0?'Bugün':days===1?'Yarın':days+' gün kaldı';
  return '<article class="ex-card"><div class="ex-card-head"><span class="ex-chip">'+e(r.examType||'Sınav')+'</span><span class="ex-chip">'+e(r.ders||'Ders belirtilmedi')+'</span></div><div class="ex-card-title"><div><h3>'+e(r.ad)+'</h3><small>📅 '+e(exDate(r.tarih))+' · '+e(r.saat||'Saat belirtilmedi')+(r.yer?' · 📍 '+e(r.yer):'')+'</small></div><b class="ex-countdown '+(days<=1&&days>=0?'urgent':'')+'">'+e(countdown)+'</b></div>'+(r.target!=null?'<div class="ex-target">🎯 Hedef: <b>'+e(r.target)+'</b>'+(r.score!=null?' · Sonuç: <b>'+e(r.score)+'</b>':'')+'</div>':'')+(plan.length?'<div class="ex-progress"><div><b>Hazırlık planı</b><span>%'+pct+' · '+exDone(r)+'/'+plan.length+'</span></div><i><b style="width:'+pct+'%"></b></i></div><div class="ex-plan-list">'+plan.map((p,i)=>'<label class="ex-plan-item '+(p.done?'is-done':'')+'"><input type="checkbox" '+(p.done?'checked':'')+' onchange="examToggle(\''+r.id+'\','+i+',this.checked)"><span>'+e(p.title)+'<small>'+e(exDate(p.date))+'</small></span></label>').join('')+'</div>':'<p class="m ex-no-plan">'+topics.length+' konu · plan oluşturulmamış</p>')+'<div class="ex-card-actions"><button onclick="examEdit(\''+r.id+'\')">✏️ Düzenle / Plan</button><button onclick="examResult(\''+r.id+'\')">📊 '+(r.score==null||r.score===''?'Not gir':'Sonucu düzenle')+'</button></div></article>';
 }).join('');
 const upcomingCount=active.length,doneCount=all.filter(r=>exPlan(r).length&&exDone(r)===exPlan(r).length).length;
 return '<style>.ex-center{max-width:1000px;margin:auto;color:var(--tx)}.ex-center *{box-sizing:border-box}.ex-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin:8px 0 22px}.ex-heading h1{font-size:clamp(28px,6vw,38px);letter-spacing:-.04em;margin:5px 0}.ex-heading p{max-width:580px}.ex-heading .p{white-space:nowrap;padding:13px 18px;border-radius:16px;background:linear-gradient(135deg,#66b9f5,#3978c8);box-shadow:0 8px 22px #3b83ce38}.ex-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:0 0 16px}.ex-stats>div{padding:16px;border:1px solid rgba(148,183,222,.16);border-radius:20px;background:linear-gradient(145deg,#15243a,#0c1627);box-shadow:0 8px 24px #0002}.ex-stats small{display:block;color:#9eb4cd;font-size:12px}.ex-stats b{display:block;font-size:27px;margin-top:5px;color:#f3f8ff}.ex-next{display:flex;flex-direction:column;gap:4px;padding:18px 20px;margin:0 0 16px;border:1px solid #5da7ed55;border-radius:22px;background:radial-gradient(circle at 100% 0,#2f73bc40,transparent 48%),linear-gradient(135deg,#142b48,#0e1b30)}.ex-next small{color:#7ec2ff;font-weight:800;letter-spacing:.14em}.ex-next b{font-size:20px}.ex-next span{color:#b4c8df}.ex-tabs{display:flex;gap:8px;overflow:auto;padding:4px 0 14px}.ex-tabs button{flex:none;border-radius:14px;padding:11px 15px;background:#152238;border:1px solid #ffffff12;color:#b8cbe0}.ex-tabs button.active{background:linear-gradient(135deg,#4b96e3,#2f65bb);border-color:#75b9f3;color:white;box-shadow:0 6px 18px #377ac333}.ex-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.ex-card{min-width:0;padding:18px;border:1px solid rgba(142,178,220,.17);border-radius:23px;background:linear-gradient(145deg,#17263b,#0d1728);box-shadow:0 12px 28px #0002;overflow:hidden}.ex-card-head{display:flex;justify-content:space-between;gap:7px;flex-wrap:wrap}.ex-chip{border-radius:99px;padding:6px 10px;background:#274567;color:#b9ddff;font-size:11px;font-weight:750}.ex-card-title{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin:14px 0}.ex-card-title h3{font-size:20px;margin:0 0 6px;overflow-wrap:anywhere}.ex-card-title small{color:#9db2cb;line-height:1.5}.ex-countdown{flex:none;border-radius:12px;padding:8px 10px;background:#16395b;color:#8fd0ff;font-size:12px}.ex-countdown.urgent{background:#71343c;color:#ffd0d4}.ex-target{padding:10px 12px;border-radius:13px;background:#ffffff08;color:#b7cbe1}.ex-progress{margin:14px 0}.ex-progress>div{display:flex;justify-content:space-between;gap:8px;font-size:12px;color:#b9cbe0;margin-bottom:7px}.ex-progress>i{display:block;height:8px;border-radius:99px;background:#ffffff12;overflow:hidden}.ex-progress>i>b{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#51a3ee,#76d0ff)}.ex-plan-list{display:flex;flex-direction:column;gap:6px;max-height:230px;overflow:auto}.ex-plan-item{display:flex;align-items:center;gap:10px;padding:10px;border-radius:13px;background:#ffffff06;color:#d7e5f5}.ex-plan-item input{width:18px;height:18px;accent-color:#66b9f5}.ex-plan-item span{min-width:0}.ex-plan-item small{display:block;color:#91a9c4;margin-top:3px}.ex-plan-item.is-done span{text-decoration:line-through;opacity:.6}.ex-card-actions{display:flex;gap:8px;margin-top:15px}.ex-card-actions button{flex:1;min-width:0;padding:10px;border-radius:13px;background:#1b2b43;border:1px solid #ffffff15;color:#e1efff;font-size:13px}.ex-card-actions button:first-child{background:#24517d}.ex-no-plan{padding:13px;background:#ffffff07;border-radius:14px}.hw-empty{grid-column:1/-1;padding:32px;border-radius:22px;border:1px dashed #6da8e255;background:#13233a;text-align:center}.ex-form{max-width:100%;}.ex-form header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}.ex-form header h2{margin:4px 0}.ex-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.ex-form label{margin:8px 0}.ex-form input,.ex-form select,.ex-form textarea{border-radius:13px;background:#0d1728;border-color:#ffffff20}.ex-form textarea{resize:vertical}.ex-form .ex-plan-hint{padding:12px;border-radius:14px;background:#173452;color:#b9d9f5}.ex-form .row{display:flex;gap:10px;flex-wrap:wrap}.ex-form .row button{flex:1;padding:12px;border-radius:14px}.ex-form .row button.p{background:linear-gradient(135deg,#67baf5,#3978c8)}@media(max-width:700px){.ex-heading{align-items:stretch;flex-direction:column}.ex-heading .p{width:100%}.ex-stats{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.ex-stats>div{padding:13px}.ex-list{grid-template-columns:1fr}.ex-card{padding:16px}.ex-card-actions button{font-size:12px;padding:10px 7px}.ex-form-grid{grid-template-columns:1fr;gap:4px}.ex-tabs button{padding:10px 12px}}@media(prefers-reduced-motion:no-preference){.ex-card{animation:up .32s ease both}.ex-card:nth-child(2){animation-delay:.05s}}</style><section class="ex-center"><header class="ex-heading"><div><span class="hw-eyebrow">ACADEMIC EXAM PLANNER</span><h1>Sınav Merkezi</h1><p class="m">Sınavlarını planla, konularını tamamla ve akademik başarını takip et.</p></div><button class="p" onclick="examEdit()">＋ Sınav ekle</button></header><div class="ex-stats"><div><small>Yaklaşan sınav</small><b>'+upcomingCount+'</b></div><div><small>Planı tamamlanan</small><b>'+doneCount+'</b></div><div><small>Sonuç girilen</small><b>'+completed.length+'</b></div><div><small>Not ortalaması</small><b>'+(avg==null?'—':avg.toFixed(1))+'</b></div></div>'+(next?'<div class="ex-next"><small>EN YAKIN SINAV</small><b>'+e(next.ad)+'</b><span>'+(exDays(next.tarih)===0?'Bugün':exDays(next.tarih)+' gün kaldı')+' · '+e(exDate(next.tarih))+'</span></div>':'')+'<nav class="ex-tabs">'+tabs.map(([id,label])=>'<button class="'+(tab===id?'active':'')+'" onclick="cur.exTab=\''+id+'\';render()">'+label+'</button>').join('')+'</nav><div class="ex-list">'+(cards||'<div class="hw-empty"><span>🧪</span><b>Henüz sınav eklenmemiş.</b><small>İlk sınavını ekle; konularını günlere otomatik dağıtalım.</small><button class="p" onclick="examEdit()">＋ İlk sınavını ekle</button></div>')+'</div></section>';
}
async function examEdit(id){
 const r=id?await P(tx('rec').get(id)):null;if(r&&r.type!=='sinav')return;
 const x=r||{},courses=await recs(W.id,'ders'),topics=exTopics(x);
 dlg('<div class="ex-form"><header><div><span class="hw-eyebrow">SINAV DETAYI</span><h2>'+(r?'Sınavı düzenle':'Yeni sınav oluştur')+'</h2></div><button onclick="dlg()">×</button></header><label>Sınav adı<input id="exName" maxlength="120" value="'+e(x.ad||'')+'" placeholder="Örn. Anatomi Final"></label><div class="ex-form-grid"><label>Ders<select id="exCourse"><option value="">Ders seç</option>'+courses.map(c=>'<option '+(x.ders===c.ad?'selected':'')+'>'+e(c.ad)+'</option>').join('')+'</select></label><label>Sınav türü<select id="exType">'+['Vize','Final','Bütünleme','Quiz','Sözlü','Diğer'].map(v=>'<option '+((x.examType||'Final')===v?'selected':'')+'>'+v+'</option>').join('')+'</select></label></div><div class="ex-form-grid"><label>Tarih<input id="exDate" type="date" value="'+e(x.tarih||'')+'"></label><label>Saat<input id="exTime" type="time" value="'+e(x.saat||'')+'"></label></div><div class="ex-form-grid"><label>Sınav yeri<input id="exPlace" value="'+e(x.yer||'')+'" placeholder="Sınıf / salon"></label><label>Hedef not<input id="exTarget" type="number" min="0" max="100" value="'+e(x.target??'')+'" placeholder="80"></label></div><label>Çalışılacak konular <small>(Her satıra bir konu yaz)</small><textarea id="exTopics" rows="5" placeholder="Hücre yapısı&#10;Doku çeşitleri&#10;Organ sistemleri">'+e(topics.join('\n'))+'</textarea></label><p class="m ex-plan-hint">Kaydettiğinde konular sınav tarihine kadar olan günlere otomatik dağıtılır. Son gün genel tekrar ayrılır. Planı daha sonra düzenleyebilirsin.</p><label>Açıklama<textarea id="exNote" rows="2">'+e(x.not||'')+'</textarea></label><div class="row"><button onclick="dlg()">Vazgeç</button><button class="p" onclick="examSave(\''+(x.id||'')+'\')">Kaydet ve planı oluştur</button></div>'+(r?'<div class="ex-delete"><button onclick="examDelete(\''+r.id+'\')">Sınavı sil</button></div>':'')+'</div>');
}
async function examSave(id){
 const ad=$('exName').value.trim(),tarih=$('exDate').value;
 if(!ad||!tarih){toast('Sınav adı ve tarihi gerekli');return}
 const old=id?await P(tx('rec').get(id)):null,topics=$('exTopics').value.split('\n').map(x=>x.trim()).filter(Boolean);
 const changed=!old||old.tarih!==tarih||JSON.stringify(exTopics(old))!==JSON.stringify(topics);
 const plan=changed?exBuildPlan(tarih,topics):exPlan(old);
 const r={...(old||{}),id:id||uid(),ws:W.id,type:'sinav',ad,ders:$('exCourse').value,tarih,saat:$('exTime').value,yer:$('exPlace').value.trim(),examType:$('exType').value,target:$('exTarget').value===''?null:Number($('exTarget').value),topics,studyPlan:plan,not:$('exNote').value.trim(),ts:old?.ts||Date.now()};
 await put('rec',r);dlg();cur.exTab='all';render();toast(changed?'Sınav ve kişisel hazırlık planı kaydedildi':'Sınav güncellendi');
}
async function examToggle(id,i,done){
 const r=await P(tx('rec').get(id));if(!r)return;const p=exPlan(r);if(!p[i])return;p[i].done=!!done;await put('rec',r);render();
}
async function examResult(id){
 const r=await P(tx('rec').get(id));if(!r)return;
 dlg('<div class="ex-form"><h2>📊 Sınav sonucu</h2><p>'+e(r.ad)+'</p><label>Alınan not<input id="exScore" type="number" min="0" max="100" value="'+e(r.score??'')+'" placeholder="85"></label><div class="row"><button onclick="dlg()">Vazgeç</button><button class="p" onclick="examResultSave(\''+id+'\')">Kaydet</button></div></div>');
}
async function examResultSave(id){const r=await P(tx('rec').get(id));if(!r)return;const v=$('exScore').value;if(v===''||+v<0||+v>100){toast('0 ile 100 arasında not gir');return}r.score=Number(v);await put('rec',r);dlg();cur.exTab='results';render();toast('Sınav sonucu kaydedildi')}
async function examDelete(id){if(!confirm('Bu sınav ve hazırlık planı silinsin mi?'))return;await del('rec',id);dlg();render();toast('Sınav silindi')}
