/* ---- Ana ekran ---- */
async function render(){
 const L=await all('ws'),ms=W.mods.filter(k=>AV.ogr.includes(k));
 const rs=document.documentElement.style;rs.setProperty('--ac',W.color||'');rs.setProperty('--ac2',W.color?`color-mix(in srgb,${W.color} 16%,var(--sf))`:'');
 const bv=W.bg?.v;document.documentElement.classList.toggle('bgon',!!bv);document.body.style.backgroundImage=bv?(W.bg.t==='img'?`url("${bv}")`:bv):'';
 rs.setProperty('--ibr',{c:'50%',r:'10px',s:'3px'}[W.ish||'c']);rs.setProperty('--ibg',W.ibg||'');
 if(bv&&W.bg.dark===undefined){if(W.bg.t==='g')W.bg.dark=bv.includes('#1f1b3a');else lumOf(bv).then(d=>upd({bg:{...W.bg,dark:d}}))}
 const dd=bv?W.bg.dark:undefined,tc=dd===undefined?['','','','','']:dd?['#f4f4f1','#d3d3cc','#1c1d1c','#10110f','#ffffff22']:['#1d1d1b','#55544e','#ffffff','#f6f5f1','#00000018'];
 ['--tx','--mu','--sf','--bg','--bd'].forEach((k,i)=>rs.setProperty(k,tc[i]));rs.setProperty('color-scheme',dd?'dark':dd===false?'light':'');
 if(!cur.m||(cur.m!=='ayar'&&cur.m!=='duzen'&&cur.m!=='bugun'&&!ms.includes(cur.m)))cur.m='bugun';
 const tabs=M[cur.m]?.[2]||[cur.m];if(!tabs.includes(cur.t))cur.t=tabs[0];
 if(cur.m==='odak'&&PT.stage==='fullscreen'){clearInterval(DCI);document.body.classList.add('focus-active');$('app').innerHTML=focusScreen();ensureSpotifyUI();return}
 document.body.classList.remove('focus-active');
 const body=cur.m==='bugun'?await bugun():cur.m==='uni'?await uniPage():cur.m==='duzen'?await duzen(L):cur.m==='ayar'?await ayar(L):cur.t==='ay'?await ay():cur.t==='program'?await program():cur.t==='odak'?await odak():cur.t==='calis'?await calis():cur.t==='not'?await defter():cur.t==='hesap'?await hesap():await list(cur.t);
 $('app').innerHTML=`<div class="shell"><aside class="side"><div class="wsb" title="${e(W.name)}">${W.icon?`<i class="ib">${e(W.icon)}</i>`:'<img class="brandmark" src="/logo.svg" alt="Çalışma Alanım">'}<span class="lb">${e(W.name)}</span></div>
 <div class="nav"><button title="Bugün" class="${cur.m==='bugun'?'on':''}" onclick="cur.m='bugun';render()"><i class="ib">🏠</i><span class="lb">Bugün</span></button>${ms.map(k=>`<button title="${e(mn(k))}" class="${cur.m===k?'on':''}" onclick="cur.m='${k}';cur.t=null;cur.q='';cur.d='';render()"><i class="ib">${mi(k)}</i><span class="lb">${mn(k)}</span></button>`).join('')}</div>
 <div class="nav nav2"><button title="Düzen" class="${cur.m==='duzen'?'on':''}" onclick="cur.m='duzen';render()"><i class="ib">🎛️</i><span class="lb">Düzen</span></button><button title="Ayarlar" class="${cur.m==='ayar'?'on':''}" onclick="cur.m='ayar';render()"><i class="ib">⚙️</i><span class="lb">Ayarlar</span></button></div></aside>
 <main class="main">${tabs.length>1&&cur.m!=='ayar'?`<div class="tabs">${tabs.map(t=>`<button class="${cur.t===t?'on':''}" onclick="cur.t='${t}';cur.q='';cur.d='';render()">${TL[t]}</button>`).join('')}</div>`:''}${body}</main></div>`;ensureSpotifyUI();
}
