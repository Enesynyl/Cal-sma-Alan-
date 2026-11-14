const CACHE='calisma-alanim-shell-v1';
self.addEventListener('install',event=>{self.skipWaiting()});
self.addEventListener('activate',event=>{event.waitUntil(self.clients.claim())});
self.addEventListener('push',event=>{
 let data={title:'Çalışma Alanım',body:'Yeni bir bildirimin var.',url:'/'};
 try{data={...data,...event.data.json()}}catch(e){if(event.data)data.body=event.data.text()}
 event.waitUntil(self.registration.showNotification(data.title,{body:data.body,icon:'/logo.svg',badge:'/logo.svg',tag:data.tag||'calisma-alanim',data:{url:data.url||'/'},renotify:false}));
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();const url=event.notification.data?.url||'/';
 event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
  for(const client of list)if('focus'in client)return client.focus();
  return self.clients.openWindow?self.clients.openWindow(url):undefined;
 }));
});