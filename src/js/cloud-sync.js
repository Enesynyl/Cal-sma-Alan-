let fbAuthBusy=false;
function fbAuthOverlay(show,message='Çalışma alanın açılıyor'){
 let layer=document.getElementById('ca-auth-loading');
 if(!show){layer?.remove();document.body.classList.remove('auth-loading-active');return}
 if(!layer){layer=document.createElement('div');layer.id='ca-auth-loading';layer.className='ca-auth-loading';layer.setAttribute('role','status');layer.setAttribute('aria-live','polite');layer.innerHTML='<div class="ca-auth-loading-card"><span class="ca-auth-loading-mark" aria-hidden="true">✦</span><span class="ca-auth-loading-spinner" aria-hidden="true"></span><b data-auth-loading-title></b><small>Güvenli bağlantı kuruluyor</small></div>';document.body.appendChild(layer)}
 layer.querySelector('[data-auth-loading-title]').textContent=message;document.body.classList.add('auth-loading-active');
}
window.showWorkspaceLoading=message=>fbAuthOverlay(true,message);
window.hideWorkspaceLoading=()=>fbAuthOverlay(false);
function fbAuthButtonBusy(busy,label){
 const button=$('fbGo');if(!button)return;
 button.disabled=!!busy;button.setAttribute('aria-busy',String(!!busy));
 if(busy){button.dataset.idleLabel=button.dataset.idleLabel||button.textContent;button.textContent=label}
 else if(button.dataset.idleLabel)button.textContent=button.dataset.idleLabel;
}
