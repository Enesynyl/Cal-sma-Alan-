import {requireUser,googleToken,firestoreGet,firestoreList,fieldsToObject,json} from './admin/_lib.js';
const handler = (function buildCommunityApi(){
 const R='https://firestore.googleapis.com/v1/projects/calisma-alani-34ba7/databases/(default)/documents/';
 const norm=s=>String(s||'').toLocaleLowerCase('tr').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
 const val=v=>v===null||v===undefined?{nullValue:null}:typeof v==='boolean'?{booleanValue:v}:typeof v==='number'?{integerValue:String(Math.round(v))}:Array.isArray(v)?{arrayValue:{values:v.map(val)}}:typeof v==='object'?{mapValue:{fields:Object.fromEntries(Object.entries(v).map(([k,x])=>[k,val(x)]))}}:{stringValue:String(v)};
 async function put(t,p,o){const r=await fetch(R+p,{method:'PATCH',headers:{authorization:'Bearer '+t,'content-type':'application/json'},body:JSON.stringify({fields:Object.fromEntries(Object.entries(o).map(([k,v])=>[k,val(v)]))})}),d=await r.json();if(!r.ok)throw new Error(d.error?.message||'FIRESTORE_WRITE_FAILED');return d}
 async function del(t,p){const r=await fetch(R+p,{method:'DELETE',headers:{authorization:'Bearer '+t}});if(!r.ok&&r.status!==404)throw new Error('FIRESTORE_DELETE_FAILED')}
 async function get(t,p){const x=await firestoreGet(t,p);return x.ok?fieldsToObject(x.data.fields||{}):null}
 async function list(t,p){let page='',out=[],n=0;do{const d=await firestoreList(t,p,page);out.push(...(d.documents||[]).map(x=>({id:x.name.split('/').pop(),...fieldsToObject(x.fields||{})})));page=d.nextPageToken||'';n++}while(page&&n<10&&out.length<1000);return out}

 async function createUserNotification(token,uid,title,body,type='Arkadaşlık'){
  const id='ntf_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,9);
  await put(token,'users/'+uid+'/notifications/'+id,{title,body,type,source:'community',createdAt:Date.now()});
 }
 async function pushUserDevices(token,uid,title,body){
  try{
   const raw=String(process.env.PUSH_VAPID_PRIVATE_KEY||process.env.VAPID_PRIVATE_KEY||'').trim();
   if(!/^[A-Za-z0-9_-]{43}$/.test(raw))return;
   const webpush=(await import('web-push')).default;
   webpush.setVapidDetails(String(process.env.VAPID_SUBJECT||'mailto:calismaalanim451@gmail.com'), 'BK-0Z26P6-lQmXI8MKkRmCKlPvPQKS5bfqz9MZz_vjmzxwAKEM5JzzyBrFv5lsb8q9gxVdKPfh1at_cVjpdyusA',raw);
   const devices=await list(token,'users/'+uid+'/pushSubscriptions');
   await Promise.all(devices.map(async d=>{
    try{await webpush.sendNotification({endpoint:d.endpoint,keys:{p256dh:d.p256dh,auth:d.auth}},JSON.stringify({title,body,url:'/'}))}
    catch(e){if(e.statusCode===404||e.statusCode===410)await del(token,'users/'+uid+'/pushSubscriptions/'+d.id).catch(()=>{})}
   }));
  }catch(e){console.warn('Community push notification failed:',e.message)}
 }

 const DEFAULT_ROLES=[{key:'admin',name:'Yönetici',canView:true,canSend:true,canManageMembers:true,canManageMessages:true,canInvite:true},{key:'moderator',name:'Moderatör',canView:true,canSend:true,canManageMembers:true,canManageMessages:true,canInvite:true},{key:'member',name:'Üye',canView:true,canSend:true,canManageMembers:false,canManageMessages:false,canInvite:false},{key:'viewer',name:'İzleyici',canView:true,canSend:false,canManageMembers:false,canManageMessages:false,canInvite:false}];
 const roleFor=(g,key)=>[...(g.roles||DEFAULT_ROLES)].find(r=>r.key===key)||DEFAULT_ROLES.find(r=>r.key==='member');
 const isManager=(g,uid,m)=>g.createdBy===uid||!!roleFor(g,m?.role)?.canManageMembers;

 const safe=(id,p)=>({uid:id,studentId:p.studentId||('CA-'+id),displayName:p.displayName||p.ad||'Öğrenci',university:p.university||p.universite||'',department:p.department||p.bolum||'',classYear:p.classYear||p.sinif||'',photoURL:p.photoURL||''});
 let authDirectoryCache={at:0,users:[]};
 let studentDirectoryCache={at:0,rows:[]};
 async function listAuthUsers(token){
  if(authDirectoryCache.at>Date.now()-60000&&authDirectoryCache.users.length)return authDirectoryCache.users;
  const all=[];let page='',pages=0;
  do{
   const url=new URL('https://identitytoolkit.googleapis.com/v1/projects/calisma-alani-34ba7/accounts:batchGet');
   url.searchParams.set('maxResults','1000');if(page)url.searchParams.set('nextPageToken',page);
   const r=await fetch(url,{headers:{authorization:'Bearer '+token}});
   const d=await r.json();
   if(!r.ok)throw new Error(d.error?.message||'FIREBASE_AUTH_DIRECTORY_UNAVAILABLE');
   all.push(...(d.users||[]));page=d.nextPageToken||'';pages++;
  }while(page&&pages<20);
  authDirectoryCache={at:Date.now(),users:all};return all;
 }
 async function mapLimit(items,limit,fn){
  const out=new Array(items.length);let cursor=0;
  await Promise.all(Array.from({length:Math.min(limit,items.length)},async()=>{while(true){const i=cursor++;if(i>=items.length)return;out[i]=await fn(items[i],i)}}));
  return out;
 }
 async function listStudentDirectory(token){
  if(studentDirectoryCache.at>Date.now()-120000)return studentDirectoryCache.rows;
  const accounts=await listAuthUsers(token);
  const rows=await mapLimit(accounts,30,async account=>{
   const uid=account.localId;if(!uid||account.disabled)return null;
   let profile=null;
   try{const doc=await firestoreGet(token,'users/'+uid+'/sync/profile');if(doc.ok)profile=fieldsToObject(doc.data.fields||{})}catch(err){console.warn('Student profile lookup failed',uid,err.message)}
   // Only include accounts with an actual saved student profile; Auth display names alone
   // can surface incomplete/duplicate-looking records.
   const displayName=String(profile?.ad||profile?.displayName||account.displayName||account.providerUserInfo?.[0]?.displayName||'').trim().replace(/\s+/g,' ');
   if(!displayName||profile?.discoverable===false)return null;
   const university=String(profile?.universite||profile?.university||'').trim();
   const department=String(profile?.bolum||profile?.department||'').trim();
   const classYear=String(profile?.sinif||profile?.classYear||'').trim();
   const studentId=String(profile?.studentId||('CA-'+uid));
   if(!profile?.studentId){const updated={...(profile||{}),ad:displayName,studentId,email:account.email||profile?.email||''};await put(token,'users/'+uid+'/sync/profile',updated).catch(err=>console.warn('Student ID write failed',uid,err.message));}
   const row={uid,studentId,displayName,university,department,classYear,photoURL:profile?.photoURL||'',nameKey:norm(displayName)};
   const key=[norm(displayName),norm(university),norm(department),norm(classYear)].join('|');
   return {...row,dedupeKey:key};
  });
  const unique=new Map();
  for(const row of rows.filter(Boolean))if(!unique.has(row.uid))unique.set(row.uid,row);
  studentDirectoryCache={at:Date.now(),rows:[...unique.values()]};
  return studentDirectoryCache.rows;
 }

 return async function(req,res){
  res.setHeader('Cache-Control','no-store, private');if(req.method!=='POST')return json(res,405,{ok:false,error:'Method not allowed'});
  try{
   const u=await requireUser(req,res);if(!u)return;const t=await googleToken(),b=req.body||{},a=String(b.action||''),me=await get(t,'users/'+u.uid+'/sync/profile')||{},myName=String(me.ad||me.displayName||'Öğrenci').trim().slice(0,80)||'Öğrenci';
   if(a==='getProfile'){const profile=await get(t,'users/'+u.uid+'/sync/profile')||{};const studentId=profile.studentId||('CA-'+u.uid);if(!profile.studentId){profile.studentId=studentId;await put(t,'users/'+u.uid+'/sync/profile',profile)}return json(res,200,{ok:true,profile:{...profile,studentId,email:profile.email||''}})}
   if(a==='saveProfile'){const name=String(b.ad||'').trim().replace(/\s+/g,' '),university=String(b.universite||'').trim(),department=String(b.bolum||'').trim(),classYear=String(b.sinif||'').trim(),education=String(b.egitimDurumu||'öğrenci'),photoURL=String(b.photoURL||'');if(name.length<4||name.length>80||name.split(' ').filter(Boolean).length<2)return json(res,400,{ok:false,error:'Ad ve soyadını birlikte yazmalısın.'});if(photoURL.length>300000)return json(res,400,{ok:false,error:'Profil fotoğrafı çok büyük. Daha küçük bir görsel seç.'});if(photoURL&&!/^data:image\/(jpeg|png|webp);base64,/i.test(photoURL))return json(res,400,{ok:false,error:'Profil fotoğrafı formatı geçersiz.'});if(education==='öğrenci'&&(!university||!department||!classYear))return json(res,400,{ok:false,error:'Öğrenciysen üniversite, bölüm ve sınıf bilgilerini doldur.'});const studentId=me.studentId||('CA-'+u.uid),updated={...me,ad:name,displayName:name,universite:university,bolum:department,sinif:classYear,egitimDurumu:education,studentId,photoURL,pendingEmail:String(b.pendingEmail||me.pendingEmail||''),updatedAt:Date.now()};await put(t,'users/'+u.uid+'/sync/profile',updated);const p=safe(u.uid,updated);await put(t,'communityProfiles/'+u.uid,{...p,nameKey:norm(name),updatedAt:Date.now(),discoverable:true});studentDirectoryCache.at=0;return json(res,200,{ok:true,profile:updated})}
   if(a==='updateMyName'){const name=String(b.name||'').trim().replace(/\s+/g,' ');if(name.length<4||name.length>80||name.split(' ').filter(Boolean).length<2)return json(res,400,{ok:false,error:'Lütfen adını ve soyadını birlikte yaz.'});const updated={...me,ad:name,displayName:name};await put(t,'users/'+u.uid+'/sync/profile',updated);const p=safe(u.uid,updated);await put(t,'communityProfiles/'+u.uid,{...p,nameKey:norm(name),updatedAt:Date.now(),discoverable:true});studentDirectoryCache.at=0;authDirectoryCache.at=0;return json(res,200,{ok:true,displayName:name})}
   if(a==='indexMe'){const p=safe(u.uid,me);if(p.displayName==='Öğrenci')return json(res,400,{ok:false,error:'Profilinde ad soyad bulunamadı.'});await put(t,'communityProfiles/'+u.uid,{...p,nameKey:norm(p.displayName),updatedAt:Date.now(),discoverable:true});authDirectoryCache.at=0;studentDirectoryCache.at=0;return json(res,200,{ok:true})}
   if(a==='searchPeople'){const q=norm(b.query);if(q.length<2)return json(res,200,{ok:true,people:[]});const rows=await listStudentDirectory(t);const matches=rows.filter(x=>x.uid!==u.uid&&(x.nameKey.includes(q)||norm(x.studentId).includes(q))).slice(0,20);await Promise.all(matches.map(x=>put(t,'communityProfiles/'+x.uid,{uid:x.uid,studentId:x.studentId,displayName:x.displayName,university:x.university,department:x.department,classYear:x.classYear,photoURL:x.photoURL||'',nameKey:x.nameKey,updatedAt:Date.now(),discoverable:true}).catch(err=>console.warn('Could not refresh community profile',x.uid,err.message))));const people=matches.map(({nameKey,dedupeKey,...x})=>x);return json(res,200,{ok:true,people})}
   if(a==='sendRequest'){const to=String(b.uid||'');if(!to||to===u.uid)return json(res,400,{ok:false,error:'Kendine istek gönderemezsin.'});const target=await get(t,'communityProfiles/'+to);if(!target||target.discoverable===false)return json(res,404,{ok:false,error:'Öğrenci bulunamadı.'});if(await get(t,'users/'+u.uid+'/friends/'+to))return json(res,409,{ok:false,error:'Bu öğrenci zaten arkadaşlarında.'});if(await get(t,'users/'+to+'/friendRequests/'+u.uid))return json(res,409,{ok:false,error:'İstek zaten gönderilmiş.'});const senderProfile=await get(t,'users/'+u.uid+'/sync/profile')||me;const row={uid:u.uid,displayName:myName,photoURL:senderProfile.photoURL||'',studentId:senderProfile.studentId||('CA-'+u.uid),createdAt:Date.now(),status:'pending'};await put(t,'users/'+to+'/friendRequests/'+u.uid,row);await put(t,'users/'+u.uid+'/sentFriendRequests/'+to,{uid:to,displayName:target.displayName||'Öğrenci',createdAt:row.createdAt,status:'pending'});const noticeTitle='Yeni arkadaşlık isteği';const noticeBody=myName+' sana arkadaşlık isteği gönderdi.';await createUserNotification(t,to,noticeTitle,noticeBody);await pushUserDevices(t,to,noticeTitle,noticeBody);return json(res,200,{ok:true,message:'Arkadaşlık isteği gönderildi.'})}
   if(a==='incoming'){const rows=await list(t,'users/'+u.uid+'/friendRequests');return json(res,200,{ok:true,requests:rows.map(x=>({uid:x.id,displayName:x.displayName||'Öğrenci',photoURL:x.photoURL||'',studentId:x.studentId||'',createdAt:x.createdAt||0}))})}
   if(a==='acceptRequest'||a==='rejectRequest'){const from=String(b.uid||'');if(!await get(t,'users/'+u.uid+'/friendRequests/'+from))return json(res,404,{ok:false,error:'Bekleyen istek bulunamadı.'});if(a==='acceptRequest'){await put(t,'users/'+u.uid+'/friends/'+from,{uid:from,createdAt:Date.now()});await put(t,'users/'+from+'/friends/'+u.uid,{uid:u.uid,createdAt:Date.now()});const acceptedName=String(me.ad||me.displayName||'Öğrenci');const noticeTitle='Arkadaşlık isteğin kabul edildi';const noticeBody=acceptedName+' arkadaşlık isteğini kabul etti.';await createUserNotification(t,from,noticeTitle,noticeBody);await pushUserDevices(t,from,noticeTitle,noticeBody)}await del(t,'users/'+u.uid+'/friendRequests/'+from);await del(t,'users/'+from+'/sentFriendRequests/'+u.uid);return json(res,200,{ok:true})}
   if(a==='friends'){const rows=await list(t,'users/'+u.uid+'/friends'),friends=await Promise.all(rows.map(async x=>{const p=await get(t,'communityProfiles/'+x.id);return p?safe(x.id,p):{uid:x.id,displayName:'Öğrenci'}}));return json(res,200,{ok:true,friends})}
   if(a==='createGroup'){const name=String(b.name||'').trim(),description=String(b.description||'').trim();if(name.length<3||name.length>70)return json(res,400,{ok:false,error:'Grup adı 3-70 karakter olmalı.'});if(description.length>400)return json(res,400,{ok:false,error:'Açıklama en fazla 400 karakter olabilir.'});const id='grp_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8),now=Date.now(),g={name,description,university:String(b.university||me.universite||'').slice(0,120),department:String(b.department||me.bolum||'').slice(0,100),classYear:String(b.classYear||me.sinif||'').slice(0,30),createdBy:u.uid,createdByName:myName,createdAt:now,memberCount:1,visibility:'public'};await put(t,'communityGroups/'+id,g);await put(t,'communityGroups/'+id+'/members/'+u.uid,{uid:u.uid,displayName:myName,joinedAt:now,role:'admin'});await put(t,'users/'+u.uid+'/groupMemberships/'+id,{groupId:id,joinedAt:now,role:'admin'});return json(res,200,{ok:true,group:{id,...g}})}
   if(a==='groups'){const [rows,members]=await Promise.all([list(t,'communityGroups'),list(t,'users/'+u.uid+'/groupMemberships')]);const memberIds=new Set(members.map(x=>x.id));const groups=rows.map(x=>({...x,isMember:x.createdBy===u.uid||memberIds.has(x.id)}));return json(res,200,{ok:true,groups:groups.sort((x,y)=>y.createdAt-x.createdAt)})}
   if(a==='joinGroup'){const id=String(b.groupId||''),g=await get(t,'communityGroups/'+id);if(!g)return json(res,404,{ok:false,error:'Grup bulunamadı.'});if(await get(t,'communityGroups/'+id+'/members/'+u.uid))return json(res,200,{ok:true});const joinedAt=Date.now(),profile=await get(t,'users/'+u.uid+'/sync/profile')||me,role=g.defaultRole||'member',member={uid:u.uid,displayName:myName,photoURL:profile.photoURL||'',university:profile.universite||'',department:profile.bolum||'',classYear:profile.sinif||'',joinedAt,role};await put(t,'communityGroups/'+id+'/members/'+u.uid,member);await put(t,'users/'+u.uid+'/groupMemberships/'+id,{groupId:id,joinedAt,role});await put(t,'communityGroups/'+id,{...g,memberCount:Number(g.memberCount||0)+1,updatedAt:joinedAt});return json(res,200,{ok:true,role})}
   if(a==='leaveGroup'){const id=String(b.groupId||''),g=await get(t,'communityGroups/'+id);if(!g)return json(res,404,{ok:false,error:'Grup bulunamadı.'});if(g.createdBy===u.uid)return json(res,400,{ok:false,error:'Grup kurucusu ayrılamaz.'});await del(t,'communityGroups/'+id+'/members/'+u.uid);await del(t,'users/'+u.uid+'/groupMemberships/'+id);await put(t,'communityGroups/'+id,{...g,memberCount:Math.max(0,Number(g.memberCount||1)-1)});return json(res,200,{ok:true})}
   if(a==='messages'){const id=String(b.groupId||''),g=await get(t,'communityGroups/'+id),member=await get(t,'communityGroups/'+id+'/members/'+u.uid);if(!g||!member||!roleFor(g,member.role)?.canView)return json(res,403,{ok:false,error:'Bu grubun içeriğini görüntüleme yetkin yok.'});const rows=await list(t,'communityGroups/'+id+'/messages');return json(res,200,{ok:true,messages:rows.sort((x,y)=>x.createdAt-y.createdAt).slice(-100),canSend:!!roleFor(g,member.role)?.canSend,role:member.role})}
   if(a==='sendMessage'){const id=String(b.groupId||''),message=String(b.message||'').trim(),g=await get(t,'communityGroups/'+id),member=await get(t,'communityGroups/'+id+'/members/'+u.uid);if(!message||message.length>1200)return json(res,400,{ok:false,error:'Mesaj 1-1200 karakter olmalı.'});if(!g||!member||!roleFor(g,member.role)?.canSend)return json(res,403,{ok:false,error:'Bu rolde mesaj gönderme iznin yok.'});const row={uid:u.uid,displayName:myName,message,createdAt:Date.now()},mid='msg_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7);await put(t,'communityGroups/'+id+'/messages/'+mid,{...row,id:mid});return json(res,200,{ok:true,message:{...row,id:mid}})}

   if(a==='groupMembers'){const id=String(b.groupId||''),g=await get(t,'communityGroups/'+id),self=await get(t,'communityGroups/'+id+'/members/'+u.uid);if(!g||!self||!roleFor(g,self.role)?.canView)return json(res,403,{ok:false,error:'Grup üyelerini görme yetkin yok.'});const rows=await list(t,'communityGroups/'+id+'/members');const members=await Promise.all(rows.map(async m=>{const p=await get(t,'communityProfiles/'+m.id)||await get(t,'users/'+m.id+'/sync/profile')||{};return {...safe(m.id,{...p,...m}),role:m.role||'member',joinedAt:m.joinedAt||0}}));return json(res,200,{ok:true,members,roles:g.roles||DEFAULT_ROLES,canManage:isManager(g,u.uid,self)})}
   if(a==='setMemberRole'){const id=String(b.groupId||''),target=String(b.uid||''),role=String(b.role||''),g=await get(t,'communityGroups/'+id),self=await get(t,'communityGroups/'+id+'/members/'+u.uid),member=await get(t,'communityGroups/'+id+'/members/'+target);if(!g||!self||!member)return json(res,404,{ok:false,error:'Grup veya üye bulunamadı.'});if(!isManager(g,u.uid,self)||target===g.createdBy)return json(res,403,{ok:false,error:'Bu üyeye rol atama yetkin yok.'});const selected=roleFor(g,role);if(!selected||['admin','moderator'].includes(role)&&g.createdBy!==u.uid)return json(res,400,{ok:false,error:'Bu rolü atayamazsın.'});if(self.role==='moderator'&&selected.canManageMembers)return json(res,403,{ok:false,error:'Moderatör daha yetkili rol atayamaz.'});await put(t,'communityGroups/'+id+'/members/'+target,{...member,role});await put(t,'users/'+target+'/groupMemberships/'+id,{groupId:id,joinedAt:member.joinedAt||Date.now(),role});return json(res,200,{ok:true})}
   if(a==='typing'){const id=String(b.groupId||''),g=await get(t,'communityGroups/'+id),member=await get(t,'communityGroups/'+id+'/members/'+u.uid);if(!g||!member||!roleFor(g,member.role)?.canSend)return json(res,403,{ok:false,error:'Yazma yetkin yok.'});const active=!!b.active,path='communityGroups/'+id+'/typing/'+u.uid;if(active)await put(t,path,{uid:u.uid,displayName:myName,updatedAt:Date.now(),expiresAt:Date.now()+7000});else await del(t,path);return json(res,200,{ok:true})}
   if(a==='typingUsers'){const id=String(b.groupId||''),g=await get(t,'communityGroups/'+id),member=await get(t,'communityGroups/'+id+'/members/'+u.uid);if(!g||!member)return json(res,403,{ok:false,error:'Grup üyesi değilsin.'});const rows=await list(t,'communityGroups/'+id+'/typing');return json(res,200,{ok:true,users:rows.filter(x=>x.uid!==u.uid&&Number(x.expiresAt)>Date.now()).map(x=>({uid:x.uid,displayName:x.displayName}))})}
   if(a==='resources'){const rows=await list(t,'communityResources'),q=norm(b.query||'');return json(res,200,{ok:true,resources:rows.filter(x=>!q||norm([x.title,x.course,x.university,x.department,x.classYear].join(' ')).includes(q)).sort((x,y)=>y.createdAt-x.createdAt).slice(0,60)})}
   if(a==='addResource'){const title=String(b.title||'').trim(),course=String(b.course||'').trim(),url=String(b.url||'').trim();if(title.length<3||title.length>100)return json(res,400,{ok:false,error:'Kaynak adı 3-100 karakter olmalı.'});if(!/^https:\/\//i.test(url)||url.length>1500)return json(res,400,{ok:false,error:'PDF bağlantısı https:// ile başlamalı.'});const id='res_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8),row={title,course:course.slice(0,80),url,university:String(b.university||me.universite||'').slice(0,120),department:String(b.department||me.bolum||'').slice(0,100),classYear:String(b.classYear||me.sinif||'').slice(0,30),createdBy:u.uid,createdByName:myName,createdAt:Date.now()};await put(t,'communityResources/'+id,row);return json(res,200,{ok:true,resource:{id,...row}})}
   return json(res,400,{ok:false,error:'Bilinmeyen topluluk işlemi.'});
  }catch(e){console.error('community api error',e);return json(res,500,{ok:false,error:String(e.message||e)})}
 };
})();
export default handler;
