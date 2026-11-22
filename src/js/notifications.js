 function ensureButton(){
  let b=$id('ca-notif-button');
  if(!b){b=document.createElement('button');b.id='ca-notif-button';b.type='button';b.setAttribute('aria-label','Bildirim merkezi');b.innerHTML='<span aria-hidden="true">🔔</span><i id="ca-notif-count" hidden></i>';b.addEventListener('click',openCenter)}
  const welcome=document.querySelector('#app .intel-dashboard .intel-welcome');
  if(welcome){
   let slot=welcome.querySelector('.intel-notification-slot');
   if(!slot){slot=document.createElement('div');slot.className='intel-notification-slot';slot.setAttribute('aria-label','Bildirimler');welcome.appendChild(slot)}
   if(b.parentElement!==slot)slot.appendChild(b);
   b.classList.add('ca-notif-in-today');b.hidden=false;b.style.removeProperty('display');
  }else{
   if(b.parentElement!==document.body)document.body.appendChild(b);
   b.classList.remove('ca-notif-in-today');b.hidden=false;b.style.removeProperty('display');
  }
  renderBadge();
 }
