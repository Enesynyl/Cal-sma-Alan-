 function ensureButton(){
  let b=$id('ca-notif-button');
  if(!b){b=document.createElement('button');b.id='ca-notif-button';b.type='button';b.setAttribute('aria-label','Bildirim merkezi');b.innerHTML='<span aria-hidden="true">🔔</span><i id="ca-notif-count" hidden></i>';b.addEventListener('click',openCenter)}
  const home=document.querySelector('#app .intel-dashboard');
  if(home){
   const actions=home.querySelector('.intel-top-actions');
   if(actions&&b.parentElement!==actions)actions.insertBefore(b,actions.firstChild);
   b.classList.add('ca-notif-in-today');b.hidden=false;b.style.removeProperty('display');
  }else{
   if(b.parentElement!==document.body)document.body.appendChild(b);
   b.classList.remove('ca-notif-in-today');b.hidden=false;b.style.removeProperty('display');
  }
  renderBadge();
 }
