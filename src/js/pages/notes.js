/* ---- Notlar: responsive three-pane workspace ---- */
let NotesUI={view:'all',selected:null,query:'',tag:null,preview:false,menu:false,saveTimer:null,ready:false};
const notesData=()=>{W.notes=Array.isArray(W.notes)?W.notes:[];return W.notes};
const notesCurrent=()=>notesData().find(n=>n.id===NotesUI.selected);
async function notesPrepare(){
 if(NotesUI.ready)return;
 // Reset only the legacy Notes/Defter module data; other workspace modules remain untouched.
 if(!W.notesV2Reset){
  delete W.defter;W.notes=[];
  for(const r of await all('rec'))if(['not','dnot'].includes(r.type))await del('rec',r.id);
  W.notesV2Reset=1;await put('ws',W);
 }
 notesData();NotesUI.ready=true;
}
async function defter(){await notesPrepare();return notesRender()}
function notesMarkdown(src){
 return e(src).split('\n').map(line=>{
  if(/^### /.test(line))return '<h3>'+line.slice(4)+'</h3>';
  if(/^## /.test(line))return '<h2>'+line.slice(3)+'</h2>';
  if(/^# /.test(line))return '<h1>'+line.slice(2)+'</h1>';
  if(/^[-*] /.test(line))return '<p>• '+line.slice(2)+'</p>';
  return '<p>'+line.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\*(.+?)\*/g,'<em>$1</em>')+'</p>';
 }).join('');
}
function notesRender(){
 const allNotes=notesData(),active=notesCurrent();
 const rows=allNotes.filter(n=>{
  if(NotesUI.view==='trash')return !!n.trashedAt;
  if(n.trashedAt)return false;
  if(NotesUI.view==='pinned'&&!n.pinned)return false;
  if(NotesUI.tag&&!(n.tags||[]).includes(NotesUI.tag))return false;
  const q=NotesUI.query.trim().toLocaleLowerCase('tr');
  return !q||[n.title,n.content,...(n.tags||[])].join(' ').toLocaleLowerCase('tr').includes(q);
 }).sort((a,b)=>(Number(!!b.pinned)-Number(!!a.pinned))||(b.updatedAt||0)-(a.updatedAt||0));
 const tags=[...new Set(allNotes.filter(n=>!n.trashedAt).flatMap(n=>n.tags||[]))].sort((a,b)=>a.localeCompare(b,'tr'));
 const nav=(id,ico,label)=>'<button class="n2-nav '+(NotesUI.view===id&&!NotesUI.tag?'active':'')+'" onclick="notesSetView(\''+id+'\')"><span>'+ico+'</span><span>'+label+'</span>'+(id==='all'?'<small>'+allNotes.filter(n=>!n.trashedAt).length+'</small>':'')+'</button>';
 const list=rows.map(n=>'<button class="n2-note '+(n.id===NotesUI.selected?'selected':'')+'" onclick="notesSelect(\''+n.id+'\')"><span class="n2-note-title">'+e(n.title||'Adsız not')+(n.pinned?' <i>✦</i>':'')+'</span><span class="n2-note-preview">'+e((n.content||'Henüz içerik yok').replace(/[#>*_\x60]/g,'').replace(/\s+/g,' ').slice(0,110))+'</span><span class="n2-note-date">'+new Date(n.updatedAt||n.createdAt||Date.now()).toLocaleDateString('tr-TR',{day:'numeric',month:'short'})+'</span></button>').join('');
 let editor='';
 if(active&&!active.trashedAt){
  editor='<section class="n2-editor"><header class="n2-editor-top"><button class="n2-back" onclick="notesMobileBack()" aria-label="Not listesine dön">←</button><div class="n2-breadcrumb">Tüm Notlar <span>›</span> <b>'+e(active.title||'Adsız not')+'</b></div><div class="n2-actions"><button title="Sabitle" onclick="notesPin()">'+(active.pinned?'★':'☆')+'</button><button title="Markdown" onclick="notesPreview()">M↓</button><button title="Bağlantıyı kopyala" onclick="notesCopy()">↗</button><button title="Diğer işlemler" onclick="notesMenu()">•••</button></div></header>'+
  (NotesUI.menu?'<div class="n2-menu"><button onclick="notesPin()">Sabitle / sabitlemeyi kaldır</button><button onclick="notesPreview()">Markdown önizleme</button><button onclick="notesCopy()">Dahili bağlantıyı kopyala</button><button class="danger" onclick="notesTrash()">Çöp kutusuna taşı</button></div>':'')+
  '<input class="n2-title-input" value="'+e(active.title||'')+'" placeholder="Not başlığı" oninput="notesEdit(\'title\',this.value)"><div class="n2-meta"><span>Son düzenleme: '+new Date(active.updatedAt||Date.now()).toLocaleString('tr-TR')+'</span><div class="n2-tags">'+(active.tags||[]).map(t=>'<button onclick="notesTagFilter(\''+e(t)+'\')">#'+e(t)+'</button>').join('')+'</div></div>'+
  (NotesUI.preview?'<article class="n2-markdown">'+notesMarkdown(active.content||'')+'</article>':'<textarea class="n2-content" placeholder="Notunu buraya yaz... Markdown desteklenir." oninput="notesEdit(\'content\',this.value)">'+e(active.content||'')+'</textarea>')+
  '<footer class="n2-editor-footer"><input placeholder="Etiket ekle (Enter)" onkeydown="if(event.key===\'Enter\'){event.preventDefault();notesAddTag(this.value);this.value=\'\'}"><span>Otomatik kaydedilir</span></footer></section>';
 }else if(NotesUI.view==='trash'&&active){
  editor='<section class="n2-empty"><div class="n2-empty-icon">♻</div><h2>'+e(active.title||'Adsız not')+'</h2><p>Bu not çöp kutusunda.</p><button class="n2-primary" onclick="notesRestore()">Geri yükle</button><button class="n2-quiet danger" onclick="notesDelete()">Kalıcı olarak sil</button></section>';
 }else{
  editor='<section class="n2-empty"><div class="n2-empty-icon">✎</div><h2>Notlarını burada düzenle</h2><p>Bir not seç veya yeni bir not oluşturarak başla.</p><button class="n2-primary" onclick="notesCreate()">＋ Yeni not oluştur</button></section>';
 }
 return '<div class="n2-workspace"><aside class="n2-sidebar"><div class="n2-brand"><span class="n2-brand-mark">✎</span><b>Notlar</b><button class="n2-collapse" onclick="document.querySelector(\'.n2-workspace\').classList.toggle(\'sidebar-collapsed\')">☰</button></div><nav class="n2-navs">'+nav('all','▤','Tüm Notlar')+nav('pinned','☆','Sabitlenenler')+nav('trash','▱','Çöp Kutusu')+'</nav><div class="n2-side-heading">ETİKETLER <button onclick="notesNewTag()">DÜZENLE</button></div><div class="n2-tag-list">'+(tags.map(t=>'<button class="'+(NotesUI.tag===t?'active':'')+'" onclick="notesTagFilter(\''+e(t)+'\')"># '+e(t)+'</button>').join('')||'<span>Henüz etiket yok</span>')+'</div><div class="n2-side-bottom"><span>● Kayıt etkin</span><small>Çalışma Alanım · Notlar</small></div></aside>'+
 '<section class="n2-list-panel '+(active?'has-selection':'')+'"><div class="n2-list-head"><div><h2>'+(NotesUI.view==='trash'?'Çöp Kutusu':NotesUI.view==='pinned'?'Sabitlenenler':'Tüm Notlar')+'</h2><small>'+rows.length+' not</small></div><button class="n2-new" onclick="notesCreate()">＋</button></div><label class="n2-search"><span>⌕</span><input value="'+e(NotesUI.query)+'" placeholder="Notlarda ve etiketlerde ara" oninput="notesSearch(this.value)"><kbd>⌘ K</kbd></label><div class="n2-note-list">'+(list||'<div class="n2-list-empty">Burada henüz not yok.</div>')+'</div></section><div class="n2-editor-panel '+(active?'has-selection':'')+'">'+editor+'</div></div>';
}
/* Update only the Notes workspace.
   The outer .n2-workspace is observed by the page-entry reveal animation.
   Keeping that element mounted prevents note actions from replaying the tab animation. */
function notesRefresh(){
 const root=document.querySelector('#app .main.page-not .n2-workspace');
 if(!root){render();return}
 const template=document.createElement('template');
 template.innerHTML=notesRender();
 const next=template.content.firstElementChild;
 if(!next)return;
 const scrollSelectors=['.n2-note-list','.n2-tag-list'];
 const scrollPositions=scrollSelectors.map(selector=>[selector,root.querySelector(selector)?.scrollTop||0]);
 root.innerHTML=next.innerHTML;
 scrollPositions.forEach(([selector,top])=>{const el=root.querySelector(selector);if(el)el.scrollTop=top});
}

function notesSetView(v){NotesUI.view=v;NotesUI.tag=null;NotesUI.selected=null;NotesUI.menu=false;notesRefresh()}
function notesSelect(id){NotesUI.selected=id;NotesUI.menu=false;notesRefresh()}
async function notesCreate(){const n={id:uid(),title:'',content:'',tags:[],pinned:false,createdAt:Date.now(),updatedAt:Date.now()};notesData().unshift(n);NotesUI.view='all';NotesUI.tag=null;NotesUI.selected=n.id;await put('ws',W);notesRefresh();setTimeout(()=>document.querySelector('.n2-title-input')?.focus(),80)}
function notesSearch(v){NotesUI.query=v;const root=document.querySelector('.n2-workspace');if(!root)return;const tpl=document.createElement('template');tpl.innerHTML=notesRender();const next=tpl.content.firstElementChild;const oldList=root.querySelector('.n2-note-list'),newList=next.querySelector('.n2-note-list');if(oldList&&newList)oldList.replaceWith(newList);const oldCount=root.querySelector('.n2-list-head small'),newCount=next.querySelector('.n2-list-head small');if(oldCount&&newCount)oldCount.textContent=newCount.textContent}
function notesMobileBack(){NotesUI.selected=null;notesRefresh()}
function notesEdit(k,v){const n=notesCurrent();if(!n)return;n[k]=v;n.updatedAt=Date.now();clearTimeout(NotesUI.saveTimer);NotesUI.saveTimer=setTimeout(()=>put('ws',W),400);if(k==='title'){const t=document.querySelector('.n2-note.selected .n2-note-title');if(t)t.textContent=v||'Adsız not'}}
async function notesPin(){const n=notesCurrent();if(!n)return;n.pinned=!n.pinned;n.updatedAt=Date.now();NotesUI.menu=false;await put('ws',W);notesRefresh()}
async function notesTrash(){const n=notesCurrent();if(!n)return;n.trashedAt=Date.now();n.updatedAt=Date.now();NotesUI.selected=null;NotesUI.menu=false;await put('ws',W);notesRefresh()}
async function notesRestore(){const n=notesCurrent();if(!n)return;delete n.trashedAt;n.updatedAt=Date.now();NotesUI.view='all';await put('ws',W);notesRefresh()}
async function notesDelete(){const n=notesCurrent();if(!n)return;W.notes=notesData().filter(x=>x.id!==n.id);NotesUI.selected=null;await put('ws',W);notesRefresh()}
function notesPreview(){NotesUI.preview=!NotesUI.preview;NotesUI.menu=false;notesRefresh()}
function notesMenu(){NotesUI.menu=!NotesUI.menu;notesRefresh()}
function notesTagFilter(t){NotesUI.tag=NotesUI.tag===t?null:t;NotesUI.view='all';NotesUI.selected=null;notesRefresh()}
async function notesAddTag(v){const n=notesCurrent(),t=String(v||'').trim().replace(/^#/,'');if(!n||!t)return;n.tags=n.tags||[];if(!n.tags.includes(t))n.tags.push(t);n.updatedAt=Date.now();await put('ws',W);notesRefresh()}
function notesNewTag(){const t=prompt('Etiket adı');if(t)notesTagFilter(t.trim().replace(/^#/,''))}
async function notesCopy(){const n=notesCurrent();if(!n)return;try{await navigator.clipboard.writeText(location.href.split('#')[0]+'#note-'+n.id);toast('Not bağlantısı kopyalandı')}catch(_){toast('Bağlantı kopyalanamadı')}}
