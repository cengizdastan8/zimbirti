# TekPanel Google Play Yayın Kontrol Listesi

## Repo Tarafında Hazır Olanlar

- Android package id: `com.tekpanel.app`
- Target SDK: API 36
- Release `.aab` üretim scripti: `npm run android:release`
- Local upload keystore üretimi: `scripts/android-release-bundle.ps1`
- Internet izni kaldırıldı.
- Android otomatik backup kapatıldı.
- Store listing taslağı hazır.
- Privacy policy taslağı hazır.
- Data safety taslağı hazır.

## Release AAB Üretimi

```powershell
npm run android:release
```

Çıktı:

```text
android/app/build/outputs/bundle/release/app-release.aab
```

İlk çalıştırmada şu dosyalar oluşur:

```text
android/upload-keystore.jks
android/keystore.properties
```

Bu iki dosya gizlidir ve `.gitignore` içindedir. Mutlaka güvenli bir yere yedeklenmelidir. Kaybedilirse Play Store'da aynı uygulamayı güncellemek zorlaşabilir veya imkansız olabilir.

## Play Console'da Kullanıcının Yapacağı İşler

1. Google Play Console geliştirici hesabı aç.
2. Uygulama oluştur.
3. `app-release.aab` yükle.
4. Store listing metinlerini gir.
5. Telefon ekran görüntülerini yükle.
6. Feature graphic hazırla.
7. Privacy policy URL'si ekle.
8. Data safety formunu doldur.
9. App content formlarını doldur.
10. Yeni kişisel hesapsa kapalı test oluştur.
11. En az 12 tester'ı 14 gün boyunca kapalı testte tut.
12. Production access başvurusu yap.

## Play Review İçin Test Notları

Reviewer'a şu akış anlatılmalı:

1. Uygulamayı aç.
2. "Kanalları ayarla" panelinden "Bildirim erişimini aç" butonuna dokun.
3. Android ayarlarında TekPanel için notification access ver.
4. WhatsApp Business, Instagram veya SMS gibi seçili kanallardan yeni bildirim gelmesini sağla.
5. Bildirim TekPanel gelen ekranında görünür.
6. Kullanıcı isterse kanalları kapatabilir veya mesajı okundu yaparak panelden kaldırabilir.

## Riskler

- Google Play, notification access kullanan uygulamaları daha dikkatli inceleyebilir.
- Mağaza açıklaması "WhatsApp/Instagram mesajlarını çeker" gibi yazılırsa reddedilme riski artar.
- Uygulamanın değer önerisi "bildirimlerden yerel müşteri mesaj takibi" olarak kalmalıdır.
- Gerçek cihazda WhatsApp/Instagram/SMS bildirim testleri kapalı test sürecinde yapılmalıdır.
