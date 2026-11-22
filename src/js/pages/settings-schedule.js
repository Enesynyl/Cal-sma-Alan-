let pinUnlockBusy=false;
async function unl(h){
 if(pinUnlockBusy)return;
 const field=$('pn'),button=field?.closest('.wz')?.querySelector('button.p');
 if(!field)return;
 pinUnlockBusy=true;
 if(button){button.disabled=true;button.textContent='Açılıyor…'}
 window.showWorkspaceLoading?.('Çalışma alanın açılıyor');
 try{
  if(await hs(field.value)===h){await boot()}
  else{field.value='';field.placeholder='Yanlış PIN';field.focus()}
 }catch(error){console.error('PIN kilidi açılamadı:',error);field.value='';field.placeholder='Tekrar dene'}
 finally{pinUnlockBusy=false;window.hideWorkspaceLoading?.();if(button?.isConnected){button.disabled=false;button.textContent='Aç'}}
}