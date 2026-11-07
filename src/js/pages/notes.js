/* ---- Ders defteri ---- */
let DF={d:null,k:null,p:0,x:null,tools:false,range:null},dfT;
const dfG=()=>(W.defter=W.defter||{}),dfSv=()=>put('ws',W),dfK=()=>(dfG()[DF.d]||[]).find(x=>x.id===DF.k);
const dfIn=v=>{const k=dfK(),g=k&&k.p[DF.p];if(g){g.t=v;clearTimeout(dfT);dfT=setTimeout(dfSv,400)}};
function dfToggleTools(){DF.tools=!DF.tools;dfDraw()}
function dfRichIn(el){const g=dfCur();if(!g)return;g.html=el.innerHTML;g.t=el.innerText||'';clearTimeout(dfT);dfT=setTimeout(dfSv,350)}
function dfSaveRange(){const s=getSelection();if(s?.rangeCount){const r=s.getRangeAt(0);if($('dft')?.contains(r.commonAncestorContainer))DF.range=r.cloneRange()}}
function dfApplyTextColor(color){const el=$('dft');if(!el||!DF.range){toast('Önce rengini değiştirmek istediğin yazıyı seç.');return}el.focus();const s=getSelection();s.removeAllRanges();s.addRange(DF.range);document.execCommand('styleWithCSS',false,true);document.execCommand('foreColor',false,color);DF.range=null;dfRichIn(el)}
function dfPaste(ev){ev.preventDefault();document.execCommand('insertText',false,ev.clipboardData?.getData('text/plain')||'');dfRichIn(ev.currentTarget)}
function dfD(h){const r=$('dfroot');if(r){r.innerHTML=h;return}const d=$('dl');d.innerHTML=h;if(!d.open)d.showModal()}
function dfAc(){DF={d:null,k:null,p:0,x:null};cur.m='not';cur.t=null;render()}
function dfOpen(c,k){DF={d:c,k,p:0,x:null};cur.m='not';cur.t=null;render()}
async function defter(){await dfMig();setTimeout(dfDraw,20);return '<h1 style="margin:0 0 6px">📓 Notlar</h1><p class="m" style="margin:0 0 6px">Derslerin klasör gibi; içine konu, konunun içine defter sayfaları ekle.</p><div id="dfroot"></div>'}
function dfArm(id,f){if(DF.x===id){DF.x=null;return f()}DF.x=id;toast('Silmek için tekrar dokun');setTimeout(()=>{DF.x=null},3000)}
async function dfDraw(fl){const pgm=!!$('dfroot'),ds=[...(await recs(W.id,'ders')),{id:'genel',ad:'Genel notlar'}],X=pgm?'':'<button onclick="dlg()">✕</button>';
 if(!DF.d)return dfD(`${pgm?'':`<div class="bar"><h3 style="margin:0">📓 Ders defteri</h3>${X}</div>`}${ds.length?`<div class="fgrid">${ds.map(c=>{const n=dfG()[c.id]||[];return `<div class="fld" onclick="DF.d='${c.id}';dfDraw()"><b>${e(c.ad)}</b><small>${n.length} konu · ${n.reduce((s,x)=>s+x.p.length,0)} sayfa</small></div>`}).join('')}</div>`:'<div class="empty">Önce Dersler kısmına ders ekle.</div>'}`);
 const c=ds.find(x=>x.id===DF.d);if(!c){DF.d=null;return dfDraw()}
 if(!DF.k){const ks=dfG()[c.id]||[];return dfD(`<div class="bar"><button onclick="DF.d=null;dfDraw()">←</button><h3 style="margin:0">${e(c.ad)}</h3>${X}</div><div style="display:flex;gap:6px;margin-bottom:8px"><input id="dfn" placeholder="Yeni konu adı" onkeydown="if(event.key==='Enter')dfAdd()"><button class="p" onclick="dfAdd()" style="white-space:nowrap">＋ Konu</button></div>${ks.map(k=>`<div class="it" onclick="DF.k='${k.id}';DF.p=0;dfDraw()"><div><b>📑 ${e(k.ad)}</b><small>${k.p.length} sayfa</small></div><button class="x" onclick="event.stopPropagation();dfArm('${k.id}',()=>dfDel('${k.id}'))">🗑️</button></div>`).join('')||'<div class="empty">Henüz konu yok. Yukarıdan ekle.</div>'}`)}
 const k=dfK();if(!k){DF.k=null;return dfDraw()}
 if(!k.p.length){k.p.push({id:uid(),t:''});dfSv()}
 DF.p=Math.max(0,Math.min(DF.p,k.p.length-1));const g=k.p[DF.p];
 g.o=g.o||[];const bg=g.bg||'cizgili',BGS={cizgili:'📏 Çizgili',kareli:'🔲 Kareli',noktali:'⚪ Noktalı',duz:'⬜ Düz',sari:'🟨 Sarı kâğıt',koyu:'🌙 Koyu'},CL=['#222222','#d33333','#1f6feb','#1a8f5a','#e8a317'],SK=['⭐','❤️','📌','✅','❗','💡','📚','🎯','🔥','😊','⚠️','📝','🌸','🏆'];
 dfD(`<div class="df-topline"><button onclick="DF.k=null;DF.pen=0;dfDraw()" title="Konuya dön">←</button><h3>📑 ${e(k.ad)}</h3><button class="df-tools-toggle" title="Araçları aç veya kapat" onclick="dfToggleTools()">${DF.tools?'⌃':'⌄'}</button>${X}</div><div class="df-tools ${DF.tools?'open':''}"><div class="dtb"><label class="ph2">🖼️ Fotoğraf<input type="file" accept="image/*" hidden onchange="dfImg(this)"></label><button onclick="DF.stk=!DF.stk;dfDraw()">😊 Sticker</button><button class="${DF.pen?'p':''}" onclick="DF.pen=!DF.pen;DF.sel=null;dfDraw()">✏️ Kalem</button><select onchange="dfBg(this.value)">${Object.entries(BGS).map(([v,n])=>`<option value="${v}" ${v===bg?'selected':''}>${n}</option>`).join('')}</select></div>${DF.stk?`<div class="dtb">${SK.map(s=>`<button onclick="dfStk('${s}')">${s}</button>`).join('')}</div>`:''}${DF.pen?`<div class="dtb">${CL.map(c=>`<button onclick="DF.col='${c}';DF.er=0;dfDraw()" style="background:${c};width:30px;height:30px;padding:0;${DF.col===c&&!DF.er?'outline:3px solid var(--ac)':''}"></button>`).join('')}${[2,5,10].map(w=>`<button onclick="DF.wd=${w};dfDraw()" class="${(DF.wd||2)===w?'p':''}">${w===2?'ince':w===5?'orta':'kalın'}</button>`).join('')}<button class="${DF.er?'p':''}" onclick="DF.er=!DF.er;dfDraw()">🧽 Silgi</button><button onclick="dfUndo()">↩️</button><button onclick="dfArm('ink',dfClr)">🗑️ Çizimi sil</button></div>`:''}<div class="dtb"><b>Yazı rengi</b><label class="df-color-label">Özel renk<input type="color" value="${DF.textColor||'#222222'}" onpointerdown="dfSaveRange()" onmousedown="dfSaveRange()" onchange="DF.textColor=this.value;dfApplyTextColor(this.value)"></label>${CL.map(c=>`<button title="Seçili yazıya renk uygula" onmousedown="event.preventDefault();dfSaveRange()" onclick="dfApplyTextColor('${c}')" style="color:${c};font-weight:800">A</button>`).join('')}<span class="m">Yazıdan bir bölüm seçip renk seç.</span></div></div><div class="dtb" id="dfs" style="display:${DF.sel?'flex':'none'}"><span class="m">Seçili:</span><button onclick="dfSz(-1)">➖</button><button onclick="dfSz(1)">➕</button><button onclick="dfRs()">↺ Düzelt</button><button onclick="dfOd()">🗑️ Sil</button></div><div class="dnb"><div class="dspir"></div><div id="dfp" class="pgc ${bg} ${fl?'fl'+fl:''}"><input class="dti" placeholder="Başlık" value="${e(g.ti||'')}" oninput="dfTi(this.value)"><div id="dft" class="dftxt" contenteditable="true" role="textbox" aria-multiline="true" data-placeholder="Notunu buraya yaz…" oninput="dfRichIn(this)" onpaste="dfPaste(event)" onfocus="if(DF.sel){DF.sel=null;dfMark()}">${g.html||e(g.t||'').replace(/\n/g,'<br>')}</div><div id="dfo" onpointerdown="dfDrag(event)"></div><canvas id="dfc" class="${DF.pen?'on':''}"></canvas></div></div><div class="bar" style="margin-top:8px"><button onclick="dfGo(-1)" ${DF.p?'':'disabled'}>◀</button><span class="m">Sayfa ${DF.p+1} / ${k.p.length}</span><button onclick="dfGo(1)" ${DF.p<k.p.length-1?'':'disabled'}>▶</button></div><div class="row"><button onclick="dfPg()">＋ Yeni sayfa</button><button onclick="dfArm('p'+DF.p,dfPgDel)">🗑️ Sayfayı sil</button></div>`);setTimeout(dfInit,0)}
const dfCur=()=>{const k=dfK();return k&&k.p[DF.p]},dfSel=()=>(dfCur().o||[]).find(z=>z.id===DF.sel);
const dfTi=v=>{const g=dfCur();if(g){g.ti=v;clearTimeout(dfT);dfT=setTimeout(dfSv,400)}};
function dfBg(v){dfCur().bg=v;$('dfp').className='pgc '+v;dfSv()}
function dfInit(){dfObjs();const c=$('dfc'),p=$('dfp');if(!c||!p)return;c.width=p.clientWidth;c.height=p.clientHeight;const g=dfCur(),x=c.getContext('2d');
 if(g.ink){const im=new Image();im.onload=()=>x.drawImage(im,0,0,c.width,c.height);im.src=g.ink}
 let dn=false,lx,ly;const pt=ev=>{const r=c.getBoundingClientRect();return[ev.clientX-r.left,ev.clientY-r.top]};
 c.onpointerdown=ev=>{if(!DF.pen)return;dn=true;c.setPointerCapture(ev.pointerId);[lx,ly]=pt(ev);(DF.undo=DF.undo||[]).push(c.toDataURL());if(DF.undo.length>10)DF.undo.shift()};
 c.onpointermove=ev=>{if(!dn)return;const[nx,ny]=pt(ev);x.globalCompositeOperation=DF.er?'destination-out':'source-over';x.strokeStyle=DF.col||'#222222';x.lineWidth=DF.er?(DF.wd||2)*4:(DF.wd||2);x.lineCap='round';x.lineJoin='round';x.beginPath();x.moveTo(lx,ly);x.lineTo(nx,ny);x.stroke();lx=nx;ly=ny};
 c.onpointerup=()=>{if(!dn)return;dn=false;g.ink=c.toDataURL('image/png');dfSv()}}
function dfUndo(){const c=$('dfc'),u=(DF.undo||[]).pop();if(!u)return;const x=c.getContext('2d'),im=new Image();im.onload=()=>{x.globalCompositeOperation='source-over';x.clearRect(0,0,c.width,c.height);x.drawImage(im,0,0);dfCur().ink=c.toDataURL();dfSv()};im.src=u}
function dfClr(){const c=$('dfc');c.getContext('2d').clearRect(0,0,c.width,c.height);dfCur().ink='';dfSv()}
function dfImg(i){const f=i.files[0];i.value='';if(!f)return;const g=dfCur();if(!g)return toast('Önce bir sayfa aç');const fr=new FileReader();
 fr.onerror=()=>toast('Fotoğraf okunamadı ⚠️');
 fr.onload=()=>{const im=new Image();im.onerror=()=>toast('Bu fotoğraf biçimi desteklenmiyor (HEIC olabilir). JPG veya PNG dene ⚠️');
  im.onload=()=>{try{const m=Math.min(1,800/Math.max(im.width,im.height)),cv=document.createElement('canvas');cv.width=Math.round(im.width*m);cv.height=Math.round(im.height*m);cv.getContext('2d').drawImage(im,0,0,cv.width,cv.height);
   const o={id:uid(),k:'img',src:cv.toDataURL('image/jpeg',.8),x:.08,y:70,w:.4,hh:.4*cv.height/cv.width,r:0,kx:0,ky:0};(g.o=g.o||[]).push(o);DF.sel=o.id;dfSv();dfObjs();toast('Fotoğraf eklendi 🖼️')}catch(x){toast('Fotoğraf eklenemedi: '+x.message)}};
  im.src=fr.result};fr.readAsDataURL(f)}
function dfStk(s){const o={id:uid(),k:'stk',e:s,x:.4,y:120,s:48};dfCur().o.push(o);DF.sel=o.id;dfSv();dfObjs()}
function dfOd(){const g=dfCur();g.o=g.o.filter(z=>z.id!==DF.sel);DF.sel=null;dfSv();dfObjs()}
const dfCw=()=>$('dfp').clientWidth;
function dfAp(el,o){const cw=dfCw();el.style.left=o.x*100+'%';el.style.top=o.y+'px';if(o.k==='img'){el.style.width=o.w*100+'%';el.style.height=o.hh?o.hh*cw+'px':'auto'}else el.style.fontSize=o.s+'px';el.style.transform=(o.r||o.kx||o.ky)?`rotate(${o.r||0}deg) skew(${o.kx||0}deg,${o.ky||0}deg)`:''}
function dfObjs(){const g=dfCur(),b=$('dfo');if(!b||!g)return;b.innerHTML=g.o.map(o=>o.k==='img'?`<div class="ob" data-i="${o.id}"><img src="${o.src}" draggable="false"></div>`:`<span class="ob" data-i="${o.id}">${o.e}</span>`).join('');b.querySelectorAll('.ob').forEach(el=>dfAp(el,g.o.find(z=>z.id===el.dataset.i)));dfMark()}
function dfMark(){document.querySelectorAll('#dfo .hnd').forEach(x=>x.remove());document.querySelectorAll('#dfo .ob').forEach(x=>{const on=x.dataset.i===DF.sel;x.classList.toggle('sel',on);if(on){const o=dfSel(),H=o.k==='img'?[['nw',0,0],['n',50,0],['ne',100,0],['e',100,50],['se',100,100],['s',50,100],['sw',0,100],['w',0,50],['skx',80,0],['sky',0,80]]:[['nw',0,0],['ne',100,0],['se',100,100],['sw',0,100]];H.push(['rot',50,0]);x.insertAdjacentHTML('beforeend',H.map(([h,l,t])=>`<i class="hnd ${h}" data-h="${h}" style="left:${l}%;top:${t}%"></i>`).join(''))}});const s=$('dfs');if(s)s.style.display=DF.sel?'flex':'none'}
function dfSz(d){const o=dfSel();if(!o)return;const f=1+d*.1,cw=dfCw();if(o.k==='img'){if(!o.hh)o.hh=document.querySelector('#dfo .ob.sel').offsetHeight/cw;o.w=Math.max(.08,Math.min(1.5,o.w*f));o.hh*=f}else o.s=Math.max(16,Math.min(220,o.s*f));dfSv();dfObjs()}
function dfRs(){const o=dfSel();if(!o)return;o.r=0;o.kx=0;o.ky=0;dfSv();dfObjs()}
function dfDrag(ev){const t=ev.target,el=t.closest('.ob');if(!el||DF.pen)return;const g=dfCur(),o=g.o.find(z=>z.id===el.dataset.i);if(!o)return;if(DF.sel!==o.id){DF.sel=o.id;dfMark()}
 const cw=dfCw(),H=t.dataset.h||'',bx=$('dfp').getBoundingClientRect();if(o.k==='img'&&!o.hh)o.hh=el.offsetHeight/cw;
 const sx=ev.clientX,sy=ev.clientY,O={...o},th=(O.r||0)*Math.PI/180,cs=Math.cos(th),sn=Math.sin(th),r0=el.getBoundingClientRect(),cx0=r0.left+r0.width/2,cy0=r0.top+r0.height/2,W0=o.k==='img'?O.w*cw:el.offsetWidth,H0=o.k==='img'?O.hh*cw:el.offsetHeight;
 t.setPointerCapture(ev.pointerId);ev.preventDefault();
 const mv=m=>{const dx=m.clientX-sx,dy=m.clientY-sy,lx=dx*cs+dy*sn,ly=-dx*sn+dy*cs;
  if(!H){o.x=Math.max(-.2,Math.min(1,O.x+dx/bx.width));o.y=Math.max(-20,Math.min(bx.height-20,O.y+dy))}
  else if(H==='rot'){let a=Math.round(Math.atan2(m.clientY-cy0,m.clientX-cx0)*180/Math.PI+90);if(Math.abs(a%45)<4)a=Math.round(a/45)*45;o.r=a}
  else if(H==='skx')o.kx=Math.max(-60,Math.min(60,(O.kx||0)+lx*.4));
  else if(H==='sky')o.ky=Math.max(-60,Math.min(60,(O.ky||0)+ly*.4));
  else{const gx=/e/.test(H)?1:/w/.test(H)?-1:0,gy=/s/.test(H)?1:/n/.test(H)?-1:0;let W=W0,Hh=H0;
   if(o.k==='stk'||(gx&&gy)){W=Math.max(24,W0+gx*lx);Hh=H0*W/W0}else{if(gx)W=Math.max(24,W0+gx*lx);if(gy)Hh=Math.max(24,H0+gy*ly)}
   const ax=gx*(W-W0)/2,ay=gy*(Hh-H0)/2,X=O.x*cw+W0/2+ax*cs-ay*sn-W/2,Y=O.y+H0/2+ax*sn+ay*cs-Hh/2;o.x=X/cw;o.y=Y;
   if(o.k==='img'){o.w=W/cw;o.hh=Hh/cw}else o.s=Math.max(16,O.s*W/W0)}
  dfAp(el,o)},up=()=>{t.removeEventListener('pointermove',mv);t.removeEventListener('pointerup',up);dfSv()};t.addEventListener('pointermove',mv);t.addEventListener('pointerup',up)}
const dfGo=d=>{DF.p+=d;dfDraw(d>0?'R':'L')};
async function dfAdd(){const a=$('dfn').value.trim();if(!a){toast('Önce konu adını yaz ✏️');$('dfn').focus();return}const k={id:uid(),ad:a,p:[]};(dfG()[DF.d]=dfG()[DF.d]||[]).push(k);await dfSv();DF.k=k.id;DF.p=0;dfDraw()}
async function dfDel(id){dfG()[DF.d]=dfG()[DF.d].filter(x=>x.id!==id);await dfSv();dfDraw()}
async function dfPg(){const k=dfK();k.p.push({id:uid(),t:'',bg:(k.p[DF.p]||{}).bg});DF.p=k.p.length-1;await dfSv();dfDraw('R')}
async function dfPgDel(){const k=dfK();k.p.splice(DF.p,1);await dfSv();dfDraw('L')}
async function dfMig(){const f='mig4_'+W.id;if((await P(tx('meta').get(f)))?.v)return;const ds=await recs(W.id,'ders'),old=await recs(W.id,'not');
 old.sort((x,y)=>(x.ts||0)-(y.ts||0)).forEach(r=>{const c=ds.find(x=>trl(x.ad||'')===trl(r.ders||'')),cid=c?c.id:'genel',ks=(dfG()[cid]=dfG()[cid]||[]),ad=(r.ad||'Not').trim();let k=ks.find(x=>trl(x.ad)===trl(ad));if(!k){k={id:uid(),ad,p:[]};ks.push(k)}if(r.not&&r.not.trim())k.p.push({id:uid(),t:r.not})});
 await dfSv();await put('meta',{k:f,v:1})}
