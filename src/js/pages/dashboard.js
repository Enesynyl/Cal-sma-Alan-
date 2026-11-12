/* ---- Ana ekran ---- */
async function render(){
 const L=await all('ws'),ms=W.mods.filter(k=>AV.ogr.includes(k));
 const rs=document.documentElement.style;rs.setProperty('--ac',W.color||'');rs.setProperty('--ac2',W.color?`color-mix(in srgb,${W.color} 16%,var(--sf))`:'');
 const bv=W.bg?.v;document.documentElement.classList.toggle('bgon',!!bv);document.body.style.backgroundImage=bv?(W.bg.t==='img'?`url("${bv}")`:bv):'';
 rs.setProperty('--ibr',{c:'50%',r:'10px',s:'3px'}[W.ish||'c']);rs.setProperty('--ibg',W.ibg||'');
 if(bv&&W.bg.dark===undefined){if(W.bg.t==='g')W.bg.dark=bv.includes('#1f1b3a');else lumOf(bv).then(d=>upd({bg:{...W.bg,dark:d}}))}
 const dd=bv?W.bg.dark:undefined,tc=dd===undefined?['','','','','']:dd?['#f4f4f1','#d3d3cc','#1c1d1c','#10110f','#ffffff22']:['#1d1d1b','#55544e','#ffffff','#f6f5f1','#00000018'];
 document.documentElement.dataset.workspaceTone=dd===true?'dark':dd===false?'light':'auto';
 ['--tx','--mu','--sf','--bg','--bd'].forEach((k,i)=>rs.setProperty(k,tc[i]));rs.setProperty('color-scheme',dd?'dark':dd===false?'light':'');
 if(!cur.m||(cur.m!=='ayar'&&cur.m!=='duzen'&&cur.m!=='bugun'&&!ms.includes(cur.m)))cur.m='bugun';
 const tabs=M[cur.m]?.[2]||[cur.m];if(!tabs.includes(cur.t))cur.t=tabs[0];
 if(cur.m==='odak'&&PT.stage==='fullscreen'){clearInterval(DCI);document.body.classList.add('focus-active');$('app').innerHTML=focusScreen();ensureSpotifyUI();return}
 document.body.classList.remove('focus-active');
 let body=cur.m==='bugun'?await bugun():cur.m==='uni'?await uniPage():cur.m==='duzen'?await duzen(L):cur.m==='ayar'?await ayar(L):cur.t==='ay'?await ay():cur.t==='program'?await program():cur.t==='odak'?await odak():cur.t==='calis'?await calis():cur.t==='not'?await defter():cur.t==='hesap'?await hesap():await list(cur.t);const isTodayPage=body.includes('home-dashboard');if(isTodayPage){try{body=todayEnhance(body)}catch(err){console.error('Today editor render error:',err)}}const todayEditAction=isTodayPage&&!cur.todayEdit?'<button type="button" onclick="todayEditToggle(true)" style="position:fixed!important;right:18px!important;bottom:18px!important;z-index:2147483000!important;display:block!important;padding:14px 20px!important;border:2px solid #fff!important;border-radius:999px!important;background:#842b48!important;color:#fff!important;font-size:15px!important;font-weight:800!important;box-shadow:0 5px 22px rgba(0,0,0,.32)!important">☷ Bugün sayfasını düzenle</button>':'';
 $('app').innerHTML=`<div class="shell"><aside class="side"><div class="wsb" title="${e(W.name)}">${W.icon?`<i class="ib">${e(W.icon)}</i>`:'<img class="brandmark" src="/logo.svg" alt="Çalışma Alanım">'}<span class="lb">${e(W.name)}</span></div>
 <div class="nav"><button title="Bugün" class="${cur.m==='bugun'?'on':''}" onclick="cur.m='bugun';render()"><i class="ib">🏠</i><span class="lb">Bugün</span></button>${ms.map(k=>`<button title="${e(mn(k))}" class="${cur.m===k?'on':''}" onclick="cur.m='${k}';cur.t=null;cur.q='';cur.d='';render()"><i class="ib">${mi(k)}</i><span class="lb">${mn(k)}</span></button>`).join('')}</div>
 <div class="nav nav2"><button title="Düzen" class="${cur.m==='duzen'?'on':''}" onclick="cur.m='duzen';render()"><i class="ib">🎛️</i><span class="lb">Düzen</span></button><button title="Ayarlar" class="${cur.m==='ayar'?'on':''}" onclick="cur.m='ayar';render()"><i class="ib">⚙️</i><span class="lb">Ayarlar</span></button></div></aside>
 <main class="main">${tabs.length>1&&cur.m!=='ayar'?`<div class="tabs">${tabs.map(t=>`<button class="${cur.t===t?'on':''}" onclick="cur.t='${t}';cur.q='';cur.d='';render()">${TL[t]}</button>`).join('')}</div>`:''}${body}</main>${todayEditAction}</div>`;ensureSpotifyUI();
}

/* Today-only visual editor */
function todayEnhance(html){
 const tpl=document.createElement('template');tpl.innerHTML=html;
 const root=tpl.content.querySelector('.home-dashboard');if(!root)return html;
 const left=root.querySelector('.home-left'),cols=root.querySelector('.home-columns'),nodes=[];
 const add=(id,node)=>{if(node)nodes.push({id,node})};
 add('toolbar',root.querySelector('.home-toolbar'));add('hero',root.querySelector('.hero'));add('tiles',root.querySelector('.tiles'));
 if(left)[...left.children].forEach(node=>{
  if(node.classList.contains('home-plan'))add('plan',node);
  else if(node.classList.contains('sec')){
   const icon=node.querySelector('.sh i')?.textContent||'';
   const id=icon==='🏛️'?'uni':icon==='🧪'?'exam':icon==='⏰'?'late':icon==='📌'?'tasks':icon==='🎓'?'lessons':'next7';add(id,node);
  }
 });
 add('calendar',root.querySelector('.home-calendar'));if(cols)cols.remove();
 const layout=document.createElement('div');layout.className='today-layout'+(cur.todayEdit?' is-editing':'');
 const defaults=['toolbar','hero','tiles','uni','plan','exam','late','tasks','lessons','next7','calendar'];
 const labels={toolbar:'Üst çubuk',hero:'Karşılama alanı',tiles:'Özet kutuları',uni:'Üniversiteden son gelişmeler',plan:'Bugünkü Planım',exam:'Yaklaşan sınavlar ve notlar',late:'Geciken işler',tasks:'Bugünün işleri',lessons:'Yaklaşan dersler',next7:'Önümüzdeki 7 gün',calendar:'Takvim'};
 const custom=W.todayCustom||[],hidden=W.todayHidden||[],map=new Map(nodes.map(x=>[x.id,x.node]));
 custom.forEach(w=>{const card=document.createElement('section');card.className='today-custom-card';const h=document.createElement('h3');h.textContent=w.title;const p=document.createElement('p');p.textContent=w.body;card.append(h,p);map.set(w.id,card);labels[w.id]=w.title});
 const order=[...(W.todayOrder||[]).filter(k=>map.has(k)),...defaults.filter(k=>map.has(k)&&!(W.todayOrder||[]).includes(k)),...custom.map(w=>w.id).filter(k=>map.has(k)&&!(W.todayOrder||[]).includes(k))];
 order.filter(k=>map.has(k)&&!hidden.includes(k)).forEach(id=>{
  const wrap=document.createElement('div');wrap.className='today-widget'+(id==='toolbar'?' today-wide':'');wrap.dataset.todayId=id;
  if(cur.todayEdit){
   const tools=document.createElement('div');tools.className='today-widget-tools';
   const drag=document.createElement('button');drag.type='button';drag.className='today-drag-handle';drag.textContent='⠿';drag.title='Sürükleyerek taşı';drag.setAttribute('aria-label','Sürükleyerek taşı');drag.addEventListener('pointerdown',todayDragStart);
   const label=document.createElement('small');label.textContent=labels[id]||'Bölüm';
   const remove=document.createElement('button');remove.type='button';remove.textContent='✕';remove.title='Bu bölümü kaldır';remove.addEventListener('click',()=>todayRemove(id));
   tools.append(drag,label,remove);wrap.append(tools);
  }
  wrap.append(map.get(id));layout.append(wrap);
 });
 root.innerHTML='';
 if(cur.todayEdit){
  const bar=document.createElement('div');bar.className='today-edit-bar';
  const title=document.createElement('b');title.textContent='Bugün sayfası düzenleme';
  const hint=document.createElement('span');hint.textContent='⠿ simgesini sürükleyerek taşı, ✕ ile kaldır.';
  const actions=document.createElement('div'),add=document.createElement('button'),done=document.createElement('button');
  add.textContent='＋ Widget ekle';add.addEventListener('click',todayAddMenu);done.className='p';done.textContent='Bitti';done.addEventListener('click',()=>todayEditToggle(false));
  actions.append(add,done);bar.append(title,hint,actions);root.append(bar);
 }else{
  const launch=document.createElement('button');launch.className='today-edit-launch today-edit-floating';launch.textContent='☷ Bugün sayfasını düzenle';launch.setAttribute('aria-label','Bugün sayfasını düzenle');launch.addEventListener('click',()=>todayEditToggle(true));root.append(launch);
 }
 root.append(layout);return tpl.innerHTML;
}
let todayDrag=null,todayDragInstalled=false;
function todayDragStart(ev){
 if(!cur.todayEdit)return;ev.preventDefault();const item=ev.currentTarget.closest('.today-widget');if(!item)return;
 todayDrag={item,x:ev.clientX,y:ev.clientY,moved:false};
 if(!todayDragInstalled){document.addEventListener('pointermove',todayDragMove);document.addEventListener('pointerup',todayDragEnd);document.addEventListener('pointercancel',todayDragEnd);todayDragInstalled=true}
}
function todayDragMove(ev){
 if(!todayDrag)return;const d=todayDrag;if(!d.moved&&Math.hypot(ev.clientX-d.x,ev.clientY-d.y)<7)return;
 d.moved=true;d.item.classList.add('is-dragging');
 const target=document.elementFromPoint(ev.clientX,ev.clientY)?.closest('.today-widget');
 if(!target||target===d.item||target.parentElement!==d.item.parentElement)return;
 const r=target.getBoundingClientRect();target.parentElement.insertBefore(d.item,ev.clientY>r.top+r.height/2?target.nextSibling:target);
}
async function todayDragEnd(){
 if(!todayDrag)return;const d=todayDrag;todayDrag=null;d.item.classList.remove('is-dragging');
 if(d.moved){W={...W,todayOrder:[...document.querySelectorAll('.today-widget[data-today-id]')].map(x=>x.dataset.todayId)};await put('ws',W)}
}
function todayEditToggle(on){cur.todayEdit=!!on;render()}
async function todayRemove(id){
 const custom=W.todayCustom||[];
 if(custom.some(x=>x.id===id))W={...W,todayCustom:custom.filter(x=>x.id!==id)};
 else W={...W,todayHidden:[...(W.todayHidden||[]),id]};
 await put('ws',W);render();
}
function todayAddMenu(){
 const names={toolbar:'Üst çubuk',hero:'Karşılama alanı',tiles:'Özet kutuları',uni:'Üniversiteden son gelişmeler',plan:'Bugünkü Planım',exam:'Yaklaşan sınavlar',late:'Geciken işler',tasks:'Bugünün işleri',lessons:'Yaklaşan dersler',next7:'Önümüzdeki 7 gün',calendar:'Takvim'};
 const hidden=(W.todayHidden||[]).filter(id=>names[id]);
 let html='<h3>Widget ekle</h3><p class="m">Gizlediğin bölümleri yeniden ekleyebilir veya kendine özel bir bilgi kutusu oluşturabilirsin.</p>';
 html+=hidden.length?hidden.map(id=>'<div class="chk"><span>'+e(names[id])+'</span><button onclick="todayRestore(&quot;'+id+'&quot;)">＋ Ekle</button></div>').join(''):'<p class="m">Geri eklenecek gizli bölüm yok.</p>';
 html+='<hr><label>Yeni widget başlığı<input id="twTitle" maxlength="60" placeholder="Örn. Hatırlatmalarım"></label><label>İçerik<textarea id="twBody" maxlength="1000" rows="4" placeholder="Kendine notlar veya hatırlatmalar yaz..."></textarea></label><div class="row"><button onclick="dlg()">Kapat</button><button class="p" onclick="todayCreateCustom()">Widget oluştur</button></div>';
 dlg(html);
}
async function todayRestore(id){W={...W,todayHidden:(W.todayHidden||[]).filter(x=>x!==id)};await put('ws',W);dlg();render()}
async function todayCreateCustom(){
 const title=$('twTitle')?.value.trim(),body=$('twBody')?.value.trim();if(!title||!body){toast('Başlık ve içerik yazmalısın');return}
 const id='custom_'+uid();W={...W,todayCustom:[...(W.todayCustom||[]),{id,title,body}]};await put('ws',W);dlg();render();
}
