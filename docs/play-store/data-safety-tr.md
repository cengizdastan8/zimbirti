# Google Play Data Safety Taslağı

Bu dosya Play Console'daki Veri Güvenliği formunu doldururken kullanılacak taslaktır. Formdaki seçenekler Google tarafından değişebilir; Play Console'da görünen güncel sorulara göre son kontrol yapılmalıdır.

## Veri Toplama

Önerilen cevap:

- Uygulama kullanıcı verisi toplamaz.

Gerekçe:

TekPanel mesajları ve bildirim içeriklerini cihaz içinde işler. Uygulama mağaza sürümünde internet izni istemez ve mesajları sunucuya göndermez.

## Veri Paylaşımı

Önerilen cevap:

- Uygulama kullanıcı verisini üçüncü taraflarla paylaşmaz.

## Veri Şifreleme

Play Console bu soruyu "veriler aktarım sırasında şifreleniyor mu?" şeklinde sorarsa:

- Uygulama kullanıcı verisini sunucuya aktarmadığı için aktarım yoktur.

## Kullanıcı Veri Silme

Önerilen açıklama:

- Kullanıcı uygulama içinden "Ekranı tertemiz yap" aksiyonu ile yerel kayıtları temizleyebilir.
- Kullanıcı Android uygulama ayarlarından uygulama verisini silebilir.
- Uygulama kaldırıldığında yerel veriler silinir.

## Hassas İzin Açıklaması

TekPanel `NotificationListenerService` kullanır.

Kullanım amacı:

- Kullanıcının açıkça verdiği Android bildirim erişimiyle seçili mesaj kanallarından gelen görünen bildirim başlığı ve metnini yerel panelde göstermek.

Kullanılmayan şeyler:

- Bildirim silme yok.
- Bildirim kaydırma yok.
- Otomatik cevap yok.
- Sosyal medya hesabına giriş yok.
- Scraping yok.
- OCR yok.
- Accessibility yok.
- Eski mesaj geçmişi yok.
- Medya çekme yok.

## Play Review İçin Kısa Açıklama

TekPanel is a local-first notification inbox for small businesses. The notification listener is required for the app's core function: displaying visible customer message notifications from user-selected messaging channels in a local inbox. The app does not transmit notification content to a server, does not automate replies, does not scrape social platforms, and does not alter or dismiss notifications.
