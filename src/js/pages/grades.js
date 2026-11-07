/* ---- Not hesabı ---- */
const HG={AA:4,BA:3.5,BB:3,CB:2.5,CC:2,DC:1.5,DD:1,FD:.5,FF:0},HL=['AA','BA','BB','CB','CC','DC','DD','FD'],HS0={AA:90,BA:85,BB:80,CB:75,CC:70,DC:60,DD:50,FD:40};
const hSk=()=>({...HS0,...(W.skala||{})}),hn=x=>x===''||x==null||isNaN(+x)?null:+x,hIx=l=>l==='FF'?8:HL.indexOf(l),hLt=i=>i>=8?'FF':HL[i],f2=x=>(Math.round(x*100)/100).toFixed(2);
const hHarf=(o,S,f)=>{if(W.minF&&f!=null&&f<W.minF)return 'FF';for(const l of HL)if(o>=S[l])return l;return 'FF'};
function hReq(c,l,S){if(c.fw<=0)return null;const n=Math.max((S[l]-c.v*c.vw/100)/(c.fw/100),W.minF||0,0);return Math.ceil(n*10)/10}
function hCalc(r,S){const kr=hn(r.kredi)||0,v=hn(r.vize),f=hn(r.final);let vw=hn(r.vw);if(vw==null)vw=40;vw=Math.min(100,Math.max(0,vw));const fw=100-vw;
 if(v!=null&&f!=null){const o=v*vw/100+f*fw/100,l=hHarf(o,S,f);return{st:'bitti',kr,v,f,vw,fw,o,l,pt:HG[l]}}
 if(v!=null){const b=Math.min(100,v),l=hHarf(v,S,b);return{st:'bekliyor',kr,v,vw,fw,b,o:v,l,pt:HG[l],i:hIx(l)}}
 if(r.not in HG)return{st:'harf',kr,l:r.not,pt:HG[r.not]};
 return{st:'yok',kr}}
function hGno(sp,sk){const oa=hn(W.oakts)||0,og=hn(W.ogno)||0,t=oa+sk;return t>0?(oa*og+sp)/t:null}
async function hSave(id,k,v){const r=await P(tx('rec').get(id));r[k]=v;await put('rec',r);render()}
function hPlan(cs,tg,S){const fx=cs.filter(c=>c.st!=='bekliyor'&&c.st!=='yok'&&c.kr>0),pd=cs.filter(c=>c.st==='bekliyor'&&c.kr>0).map(c=>({c,i:c.i,rq:c.b})),steps=[];
 const val=()=>{let sp=0,sk=0;fx.forEach(c=>{sp+=c.pt*c.kr;sk+=c.kr});pd.forEach(p=>{sp+=HG[hLt(p.i)]*p.c.kr;sk+=p.c.kr});return hGno(sp,sk)};
 while(val()<tg){let best=null,bs=-1;for(const p of pd){if(p.i===0)continue;const L=HL[p.i-1],rq=hReq(p.c,L,S);if(rq==null||rq>100)continue;const gain=(HG[L]-HG[hLt(p.i)])*p.c.kr,sc=gain/Math.max(rq-p.rq,.5);if(sc>bs){bs=sc;best={p,L,rq}}}
  if(!best)break;best.p.i--;best.p.rq=best.rq}
 return{ok:val()>=tg,v:val(),plan:pd.filter(p=>p.i<p.c.i).map(p=>({ad:p.c.ad,L:hLt(p.i),rq:p.rq,was:hLt(p.c.i)}))}}
async function hesap(){
 const S=hSk(),L=(await recs(W.id,'ders')).sort((a,b)=>(a.ad||'').localeCompare(b.ad||'','tr')),cs=L.map(r=>({id:r.id,ad:r.ad||'Ders',...hCalc(r,S)}));
 const cn=cs.filter(c=>c.st!=='yok'&&c.kr>0);let sp=0,sk=0;cn.forEach(c=>{sp+=c.pt*c.kr;sk+=c.kr});
 const dno=sk?sp/sk:null,gno=hGno(sp,sk),hd=hn(W.hedef),bk=cs.filter(c=>c.st==='bekliyor'),hasPrev=!!(hn(W.oakts)&&hn(W.ogno)!=null);
 let h=`<div class="bar" style="gap:8px;flex-wrap:wrap"><span class="m">Vize + final → harf notu ve ortalama</span><div style="display:flex;gap:6px;flex-wrap:wrap"><button onclick="hSet1()">⚙️ Harf aralıkları</button><button onclick="hSet2()">🎯 Hedef / önceki dönem</button><button class="p" onclick="frm('ders')">＋ Ders ekle</button></div></div>`;
 if(!L.length)return h+`<div class="empty">Önce ders ekle, sonra vize ve final notlarını buradan girersin.</div>`;
 h+=`<div class="grid" style="margin-bottom:10px"><div class="st"><b>${dno==null?'—':f2(dno)}</b>Dönem ortalaması (DNO)</div>${hasPrev&&gno!=null?`<div class="st"><b>${f2(gno)}</b>Genel ortalama (GNO)</div>`:''}<div class="st"><b>${sk}</b>Hesaplanan AKTS</div>${hd!=null?`<div class="st"><b>${f2(hd)}</b>Hedef ${hasPrev?'GNO':'DNO'}</div>`:''}</div>`;
 h+=cs.map(c=>{const hl=c.st==='yok'?'':`<span class="bdg ${c.l==='FF'?'k':''}">${c.l}${c.o!=null?' · '+Math.round(c.o*10)/10:''}</span>`;
  let note='';if(c.st==='yok')note='Vize notunu girince hesaplanır.';else if(c.st==='harf')note='Kayıtlı harf notu kullanılıyor. Vize/final girersen buna göre hesaplanır.';else if(c.st==='bitti')note=`Ortalama: ${c.v}×%${c.vw} + ${c.f}×%${c.fw} = ${Math.round(c.o*10)/10}`;else note=`Final girilmedi — tahmin: finalde vizeyle aynı notu (${c.v}) alırsan ${c.l}.`;
  if(!c.kr&&c.st!=='yok')note+=' ⚠️ AKTS girilmedi, ortalamaya katılmıyor.';
  const r=L.find(x=>x.id===c.id),iv=k=>r[k]==null?'':e(r[k]);
  return `<div class="card hc"><div class="bar" style="margin-top:12px"><b>${e(c.ad)}</b>${hl}</div><div class="g4"><label>AKTS<input type="number" inputmode="decimal" min="0" step="any" value="${iv('kredi')}" onchange="hSave('${c.id}','kredi',this.value)"></label><label>Vize<input type="number" inputmode="decimal" min="0" max="100" step="any" value="${iv('vize')}" onchange="hSave('${c.id}','vize',this.value)"></label><label>Final<input type="number" inputmode="decimal" min="0" max="100" step="any" value="${iv('final')}" onchange="hSave('${c.id}','final',this.value)"></label><label>Vize %<input type="number" inputmode="decimal" min="0" max="100" placeholder="40" value="${iv('vw')}" onchange="hSave('${c.id}','vw',this.value)"></label></div><div class="hn">${note}</div></div>`}).join('');
 /* Öneriler */
 const T2=[],mt=hasPrev?'GNO':'DNO',gv=(dp,dk)=>{const a=hGno(sp-0+dp,sk-0+dk);return a};
 const base=hasPrev?gno:dno;
 const ups=bk.filter(c=>c.kr>0&&c.i>0).map(c=>{const Ln=HL[c.i-1],rq=hReq(c,Ln,S);if(rq==null||rq>100)return null;const gain=(HG[Ln]-c.pt)*c.kr,nv=hGno(sp+gain,sk),g=nv-base;return{c,Ln,rq,g,sc:g/Math.max(rq-c.b,.5)}}).filter(Boolean).sort((a,b)=>b.sc-a.sc);
 ups.slice(0,3).forEach((u,i)=>T2.push(['',`${['🥇','🥈','🥉'][i]} <b>${e(u.c.ad)}</b> (${u.c.kr} AKTS): finalden en az <b>${u.rq}</b> alırsan ${u.c.l} → <b>${u.Ln}</b> olur. ${mt} yaklaşık <b>+${f2(u.g)}</b> artar (şu an için tahminin ${Math.round(u.c.b*10)/10}).`]));
 bk.forEach(c=>{const rq=hReq(c,'DD',S);if(rq==null)return;if(rq>100)T2.push(['k',`❌ <b>${e(c.ad)}</b>: finalden 100 alsan bile DD için yetmiyor (vize ${c.v}). Bütünleme / ders tekrarı seçeneklerini düşün.`]);else if(rq>=60)T2.push(['w',`⚠️ <b>${e(c.ad)}</b>: geçmek (DD) için finalden en az <b>${rq}</b> almalısın — buna en çok çalış.`])});
 if(hd!=null&&sk>0){if(base>=hd&&!bk.length)T2.push(['g',`✅ Hedefine (${f2(hd)}) ulaştın.`]);else{const pl=hPlan(cs,hd,S);if(pl.v>=hd&&!pl.plan.length)T2.push(['g',`✅ Tahmine göre hedefine ulaşıyorsun (${f2(pl.v)} ≥ ${f2(hd)}).`]);else if(pl.ok)T2.push(['',`🎯 <b>Hedef ${f2(hd)} ${mt} için yapman gerekenler:</b><br>${pl.plan.map(x=>`• ${e(x.ad)}: finalden en az <b>${x.rq}</b> → ${x.was} yerine <b>${x.L}</b>`).join('<br>')}`]);else T2.push(['k',`🎯 Bekleyen finallerin hepsi mümkün olan en yüksek notla bitse bile ${mt} en fazla <b>${f2(pl.v)}</b> olur; hedef ${f2(hd)} bu dönem ulaşılamıyor. Hedefi biraz düşürmek ya da bitmiş derslerden tekrar yoluyla not yükseltmek gerekir.`])}}
 const rt=cs.filter(c=>c.st!=='bekliyor'&&c.st!=='yok'&&c.kr>0&&HG[c.l]<=1.5).map(c=>{const g=hGno(sp+(2-c.pt)*c.kr,sk)-base;return{c,g}}).sort((a,b)=>b.g-a.g).slice(0,2);
 rt.forEach(x=>T2.push(['w',`🔁 <b>${e(x.c.ad)}</b> (${x.c.l}, ${x.c.kr} AKTS) bitmiş durumda. Üniversiten ders tekrarı / not yükseltme izni veriyorsa CC'ye çıkarsan ${mt} yaklaşık <b>+${f2(x.g)}</b> artar.`]));
 if(!bk.length&&!T2.length)T2.push(['',`Final bekleyen ders yok. Notlar kesinleşmiş görünüyor.`]);
 if(!hasPrev)T2.push(['',`💡 GNO’yu da görmek için "🎯 Hedef / önceki dönem" kısmına önceki toplam AKTS ve genel ortalamanı gir.`]);
 h+=`<div class="card tips"><h3>💡 Ne yapmalısın?</h3>${T2.map(t=>`<p class="${t[0]}">${t[1]}</p>`).join('')}<div class="hn" style="margin-top:8px;color:var(--mu);font-size:12px">Hesap, harf aralıklarını (⚙️) baz alır; üniversitene göre değişir. "Tahmin" finalde vizeyle aynı notu almaktır.</div></div>`;
 return h}
function hSet1(){const S=hSk();dlg(`<h3>⚙️ Harf aralıkları</h3><p class="m">Her harf için gereken en düşük ortalama (altı FF).</p><div class="g4" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">${HL.map(l=>`<label style="margin:4px 0">${l}<input type="number" step="any" id="sk_${l}" value="${S[l]}"></label>`).join('')}</div><label>Finalden en az (varsa, altında FF) — boş bırakabilirsin<input type="number" step="any" id="sk_min" value="${W.minF||''}"></label><div class="row"><button onclick="dlg()">Vazgeç</button><button onclick="upd({skala:null,minF:0});dlg()">Varsayılan</button><button class="p" onclick="hSv1()">Kaydet</button></div>`)}
function hSv1(){const sk={};HL.forEach(l=>{const v=hn($('sk_'+l).value);if(v!=null)sk[l]=v});const m=hn($('sk_min').value)||0;dlg();upd({skala:sk,minF:m})}
function hSet2(){dlg(`<h3>🎯 Hedef ve önceki dönem</h3><label>Hedef ortalama (örn. 3.00)<input type="number" step="any" id="h_t" value="${W.hedef??''}"></label><label>Önceki dönemlerin toplam AKTS’si (GNO için)<input type="number" step="any" id="h_a" value="${W.oakts??''}"></label><label>Şu anki genel ortalaman (önceki dönemlerin GNO’su)<input type="number" step="any" id="h_g" value="${W.ogno??''}"></label><div class="row"><button onclick="dlg()">Vazgeç</button><button class="p" onclick="hSv2()">Kaydet</button></div>`)}
function hSv2(){const o={hedef:hn($('h_t').value),oakts:hn($('h_a').value),ogno:hn($('h_g').value)};dlg();upd(o)}
