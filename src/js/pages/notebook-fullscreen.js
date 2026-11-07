/* ---- Defter tam ekran: sol kenardan yüzen menü ---- */
{const B=document.body,ed=document.createElement('div'),sc=document.createElement('div');ed.id='sedge';sc.id='sscrim';B.append(ed,sc);
 const fs=()=>B.classList.contains('dffs'),op=()=>B.classList.contains('sopen'),open=v=>B.classList.toggle('sopen',!!v&&fs());
 const want=()=>cur.m==='not'&&cur.t==='not'&&!!DF.k&&!!$('dfroot');
 const _dfD=dfD;dfD=function(){const on=cur.m==='not'&&cur.t==='not'&&!!DF.k&&!!$('dfroot');B.classList.toggle('dffs',on);if(!on)B.classList.remove('sopen');return _dfD.apply(this,arguments)};
 const _r2=render;render=async function(){B.classList.toggle('dffs',cur.m==='not'&&cur.t==='not'&&!!DF.k);B.classList.remove('sopen');const x=await _r2.apply(this,arguments);if(!want()){B.classList.remove('dffs','sopen')}return x};
 ed.addEventListener('mouseenter',()=>open(1));ed.addEventListener('click',()=>open(!op()));sc.addEventListener('click',()=>open(0));
 document.addEventListener('mousemove',e=>{if(!fs())return;if(e.clientX<=6)open(1);else if(op()){const s=document.querySelector('.side'),w=s?s.getBoundingClientRect().right:240;if(e.clientX>w+40)open(0)}});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&op())open(0)});
 let tx=null,ty=0;
 document.addEventListener('touchstart',e=>{const t=e.touches[0];tx=fs()&&(op()||t.clientX<=26)?t.clientX:null;ty=t.clientY},{passive:true});
 document.addEventListener('touchmove',e=>{if(tx===null)return;const t=e.touches[0],dx=t.clientX-tx,dy=Math.abs(t.clientY-ty);if(dy>70){tx=null;return}if(!op()&&dx>40){open(1);tx=null}else if(op()&&dx<-40){open(0);tx=null}},{passive:true});
 document.addEventListener('touchend',()=>{tx=null},{passive:true})}


