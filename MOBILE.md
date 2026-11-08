# Telefon ve tablet uygulaması

Bu proje aynı arayüzü web'de ve Capacitor ile iOS/Android uygulamasında kullanır. Yerel Spotify bağlantısı telefonda Spotify uygulamasına geçer; kullanıcı kendi açık Spotify hesabında izin verir. Kullanıcıların ayrı Client ID oluşturması gerekmez.

## Platform kurulumu

1. `npm install` ve `npm run build` çalıştırın.
2. İlk kurulumda `npx cap add android` ve `npx cap add ios` çalıştırın.
3. `npm run cap:sync` ile web dosyalarını ve Spotify eklentisini yerel uygulamalara aktarın.
4. Spotify Developer Dashboard'da `calismaalanim://spotify-callback` yönlendirme adresini ekleyin. Android paket adı ve iOS Bundle ID `com.enesynyl.calismaalanim` olmalıdır.
5. Android uygulamasını Android Studio'da, iOS uygulamasını Xcode'da açıp cihazda deneyin.

## Dağıtım öncesi gereken hesap ayarları

- Spotify Developer Dashboard'da uygulamanın sahibi bu uygulama adına yukarıdaki yönlendirme adresini bir kez eklemelidir. Son kullanıcılar Client ID oluşturmaz.
- Firebase Google girişi şu anda web açılır penceresini kullanıyor. Google, iOS/Android uygulamalarının içine gömülü web görünümünde OAuth girişini desteklemiyor. Mağaza sürümüne geçmeden önce Firebase'in yerel Google giriş ayarları ve Android/iOS uygulama yapılandırma dosyaları eklenmelidir. E-posta/şifre girişi mevcut web kimlik doğrulama akışını kullanır.
- Spotify Geliştirme Modu'nda test kullanıcıları için kısıt vardır; genel kullanıma açmadan önce Spotify'ın kota koşulları kontrol edilmelidir.

Bilgisayar ve mobil tarayıcılar mevcut web tabanlı PKCE akışını kullanır. Telefonda Spotify kurulu değilse Spotify'ın yetkilendirme ekranı açılır.

## Mağazaya hazırlık

Android mağaza paketi için Android Studio/SDK, imzalama anahtarı ve Play Console hesabı gerekir. iOS paketi için macOS, Xcode, Apple Developer hesabı ve App Store Connect kaydı gerekir. Spotify'ın Geliştirme Modu erişim sınırı, halka açık kullanım öncesinde ayrıca değerlendirilmelidir.

