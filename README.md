# TekPanel

TekPanel, Android telefona gelen seçili müşteri mesaj bildirimlerini tek ekranda gösteren local-first inbox uygulamasıdır.

Uygulama WhatsApp, WhatsApp Business, Instagram, TikTok, X / Twitter, Facebook / Messenger ve SMS gibi kanallardan gelen görünen bildirimleri cihaz içinde toplar. Amaç işletmecinin müşteri mesajlarını bildirim kalabalığında kaybetmemesidir.

## Ne Yapar

- Seçili mesaj kanallarından gelen görünen bildirimleri panele düşürür.
- Kanal filtresiyle sadece istenen kanalın mesajlarını gösterir.
- WhatsApp ve WhatsApp Business gibi kanalları ayrı açıp kapatmaya izin verir.
- Mesajı `Okundu` yaparak panelden kaldırır.
- Ekranı tek aksiyonla temizler.
- Verileri cihaz içinde `localStorage` ile tutar.
- Google Play release için signed `.aab` üretir.

## Ne Yapmaz

TekPanel şunları yapmaz:

- WhatsApp veya Instagram hesabına giriş yapmaz.
- Eski sohbet geçmişi çekmez.
- Medya, ses, fotoğraf veya video çekmez.
- Otomatik cevap göndermez.
- Scraping yapmaz.
- OCR kullanmaz.
- Accessibility ile ekran okumaz veya tıklamaz.
- Bildirimleri silmez, kaydırmaz veya bildirim paneline müdahale etmez.
- Server, auth, cloud veya sosyal medya token'ı kullanmaz.
- Mağaza sürümünde internet izni istemez.

## Geliştirme

```bash
npm run dev
```

## Kontroller

```bash
npm run lint
npm run build
npm run test:web
npm run test:native
```

## Android Debug Build

```bash
npm run mobile:sync
npm run android:build
```

APK yolu:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

## Google Play Release Build

Play Store için signed Android App Bundle üret:

```bash
npm run android:release
```

Çıktı:

```text
android/app/build/outputs/bundle/release/app-release.aab
```

İlk release çalıştırmasında şu iki dosya lokal olarak oluşturulur:

```text
android/upload-keystore.jks
android/keystore.properties
```

Bu iki dosya `.gitignore` içindedir. Güvenli bir yere yedeklenmelidir. Kaybedilirse aynı Play Store uygulamasını güncellemek zorlaşabilir veya imkansız olabilir.

Version ayarlamak için:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/android-release-bundle.ps1 -VersionCode 2 -VersionName "1.0.1"
```

## Play Store Dokümanları

Play Console için hazır taslaklar:

```text
docs/play-store/privacy-policy.md
docs/play-store/store-listing-tr.md
docs/play-store/data-safety-tr.md
docs/play-store/release-checklist.md
```

Privacy policy dosyasındaki `DESTEK_EPOSTASI_BURAYA` alanı yayın öncesi gerçek destek e-postasıyla değiştirilmelidir.

## Android Bildirim Erişimi

Kullanıcı uygulamada `Kanalları ayarla` panelinden bildirim erişimi ayarına gidebilir. Android ayarlarında TekPanel için notification access açılmadan otomatik bildirim yakalama çalışmaz.

Bildirim içeriği gizliyse, ilgili sohbet ekrandayken Android bildirim üretmiyorsa veya üretici bildirimleri kısıtlıyorsa TekPanel'e kayıt düşmeyebilir.
