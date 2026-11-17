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
