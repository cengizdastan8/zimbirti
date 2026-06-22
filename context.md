# TekPanel Tasarım Spec

## 1. Renk Tokenleri

globals.css'e eklenecek CSS değişkenleri:

```css
:root {
  --bg-app:        #eee9df;   /* Dış alan arka planı */
  --bg-surface:    #f5f3ef;   /* Ana panel yüzeyi */
  --bg-card:       #ffffff;   /* Mesaj satırları, kanal paneli */
  --bg-subtle:     #f0ede7;   /* İç nested alanlar, hover */

  --ink-primary:   #171411;   /* Birincil metin, başlıklar */
  --ink-secondary: #4a4239;   /* İkincil metin */
  --ink-muted:     #7a7065;   /* Yardımcı metin, tarih, hint */
  --ink-faint:     #9a8e80;   /* Çok soluk metin */

  --border-strong: #cec7ba;   /* Bölücü çizgiler, panel kenarları */
  --border-soft:   #e3dfd7;   /* İç separator, satır ayırıcı */

  --accent-bg:     #171411;   /* Aktif filtre, sayım badge */
  --accent-fg:     #ffffff;
}
```

Mevcut `--background: #eee9df` ve `--foreground: #1c1712` korunur; yeni tokenlar bunlara ek olarak gelir.

sourceThemes'deki badgeClass, chipClass, borderClass değerleri AYNEN korunur. Renk aksanı sadece platform badgelerinden gelir.

---

## 2. Header Yapısı

Sticky, top-0. `bg-[var(--bg-surface)]`. Backdrop-blur kaldırılır (fazla derinlik etkisi yaratıyor).

### Üst satır (tek satır, kompakt):
- Sol: "TEKPANEL" — küçük, all-caps, letter-spacing geniş, `--ink-muted` rengi. Altında değil, yanında ya da solunda yer alır.
- Sağ: mesaj sayım badge'i — `--accent-bg` dolu daire, beyaz rakam, font-black.
- Ortaya büyük h1 "Gelen mesajlar" yazılmaz. Başlık sadece "TekPanel" küçük etiketi olur; bu operasyonel bir araç, landing page değil.

### Alt satır (aksiyonlar):
- "Kanalları ayarla" ve "Ekranı temizle" butonları yan yana, `h-10`, `rounded-full`, `border border-[--border-strong]`, `bg-[--bg-card]`. Gölge yok (shadow-sm kaldırılır). Metin `text-[13px] font-bold` (font-black değil).

Border-bottom: `border-b border-[--border-strong]`. Padding: `px-4 pt-3 pb-2`.

---

## 3. Kanal Filtre Bar

Header içinde, aksiyon butonlarının altında. `overflow-x: auto`, no-scrollbar.

### Filtre chip'leri:
- Yükseklik: `h-9` (44px'e yakın, minimum tap target).
- Seçili değil: `bg-[--bg-card] border border-[--border-strong] text-[--ink-secondary]`.
- Seçili: `bg-[--accent-bg] border-[--accent-bg] text-white`.
- Sol tarafta platform icon badge'i: platform rengi dolu daire, `h-6 w-6`, `rounded-full`.
- Etiket: `text-[12px] font-bold`.
- "Tüm mesajlar" chip'i: sol tarafta mesaj sayısı içeren daire badge (seçiliyse beyaz/koyu, seçili değilse koyu/beyaz).

### Durum satırı (chip'lerin altında):
`text-[12px] font-semibold --ink-muted`. Tek satır, kısa. Mesajı basit tut.

---

## 4. Mesaj Satırı Yapısı

Mesajlar tek bir `rounded-[20px] border border-[--border-strong] bg-[--bg-card]` kart içinde listelenir. Kartlar arasında ayrı ayrı kart yok; tek liste container.

Her satır `article`:
- `border-t border-[--border-soft]` (ilk satır hariç).
- Padding: `px-4 py-3`.
- Min yükseklik: 64px (dokunma konforu).

### Satır içi düzen:
```
[Platform Badge] [Gönderici Adı]          [Tarih  Okundu]
                 [Platform chip]
                 [Mesaj metni...]
```

Platform badge (sol):
- `h-10 w-10`, `rounded-[13px]`, platform `badgeClass` rengi.
- SVG ikon `h-5 w-5` veya text label `text-[9px] font-black`.

Gönderici adı: `text-[15px] font-black leading-5 tracking-[-0.02em] --ink-primary`. Tek satır, truncate.

Platform chip: `rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] ring-1`. sourceThemes'den `chipClass`.

Mesaj metni: `text-[13px] leading-[1.45] --ink-secondary`. `line-clamp-3` — üç satırdan uzun metinler kesilir.

Tarih: `text-[11px] font-semibold --ink-muted`, sağ üst.

"Okundu" butonu: sağ alt, `h-8 px-2.5 rounded-full border border-[--border-strong] bg-[--bg-subtle] text-[11px] font-bold --ink-primary`. Tap target: en az `h-8` ama butona dokunma alanı `min-h-[44px]` için padding ile büyütülür.

---

## 5. Kanal Panel Yapısı

Header altında, `mx-4 mt-2`, `rounded-[18px] border border-[--border-strong] bg-[--bg-card] p-4`.

Gölge: `shadow-[0_4px_16px_rgba(23,20,17,0.08)]` — daha hafif.

### Panel başlık satırı:
- Sol: "Kanalları ayarla" `text-[16px] font-black`, altında kısa açıklama `text-[12px] --ink-muted`.
- Sağ: "Tümünü aç" ve "Kapat" butonları dikey stacked veya yatay sıkıştırılmış. `h-8 rounded-full` kompakt.

### Bildirim erişimi satırı (sadece native):
`rounded-[14px] border border-[--border-soft] bg-[--bg-subtle] px-3 py-2.5 mt-3`.
- Tek satır: "Bildirim erişimi" + sağda "Açık/Kapalı" badge.
- Altında "Erişimi aç" butonu: tam genişlik, `h-9 rounded-full border border-[--border-strong] bg-[--bg-card]`.

### Kanal listesi:
`mt-3 rounded-[14px] border border-[--border-soft] overflow-hidden`.
Her kanal satırı `min-h-[52px] px-3`, `divide-y divide-[--border-soft]`.
- Sol: `h-9 w-9 rounded-full` platform badge + kanal etiketi `text-[14px] font-bold`.
- Sağ: "Açık/Kapalı" — `rounded-full px-2.5 py-1 text-[10px] font-black uppercase`. Açık: `bg-[--accent-bg] text-white`. Kapalı: `bg-[--bg-subtle] --ink-muted`. Kapalı satır `opacity-50`.

---

## 6. Boş State

Container: `mx-3 mt-3`, `rounded-[18px] border border-[--border-strong] bg-[--bg-card] px-4 py-5`.

Başlık: `text-[15px] font-black --ink-primary`.
- Hiç mesaj yokken: "Bildirim bekleniyor"
- Kanal filtresi seçiliyken: "Bu kanalda mesaj yok"

Açıklama: `mt-1 text-[13px] leading-[1.5] --ink-muted`. 1-2 cümle, kısa.
- Hiç mesaj yokken: "WhatsApp, Instagram veya SMS bildirimi gelince burada görünecek."
- Kanal filtresi seçiliyken: "Üstten Tüm mesajlar'a dokun."

Separator: `mt-4 h-px bg-[--border-soft]`.
Alt not: `mt-3 text-[11px] font-semibold --ink-faint`. "Ekran temiz." ya da toplam mesaj sayısı.

Dekoratif illüstrasyon, ikon, veya uzun açıklama yok.

---

## 7. Önemli UX Notları

**Genel mimari:** Tek sayfa, scroll edilebilir mesaj listesi. Kanal paneli mesaj listesinin üzerine açılır (listenin yerini almaz, push-down yapar). Panel açıkken mesajlar hâlâ görünür.

**Büyük başlık kaldırılır:** "Gelen mesajlar" h1 kaldırılır. Header kompakt kalır; uygulama adı + sayım yeterli. Bu bir operasyonel araç.

**Renk kuralı:** Kırmızı, yeşil, turuncu gibi anlam taşıyan renkler SADECE platform badge'lerinden gelir. Başka hiçbir UI elemanına keyfi renk eklenmez. Status/priority renk kodlaması eklenmez.

**Gölge kısıtlaması:** Tek mesaj listesi container'ında hafif `shadow-sm` kabul edilir. Her satıra ayrı gölge eklenmez. Kanal panelinde tek hafif gölge.

**Font-black kullanımı:** Sadece gönderici adı, uygulama etiketi (TEKPANEL), sayım badge'i, ve kanal toggle etiketi (Açık/Kapalı). Geri kalan metinler `font-bold` veya `font-semibold`.

**Tap target:** Her tıklanabilir satır minimum `min-h-[44px]`. "Okundu" gibi küçük butonlar `padding` ile tıklanabilir alanı büyütür, görsel boyut değişmez.

**360px overflow:** Mesaj satırı içinde gönderici adı `truncate`, mesaj metni `break-words`. Aksiyon butonları (Kanalları ayarla / Ekranı temizle) `grid-cols-2` ile eşit bölünür, taşmaz. Kanal filtre chip'leri yatay scroll ile aşılır, wrap olmaz.

**localStorage/native davranışı:** Değiştirilmez. Spec sadece görsel katmanı kapsar.

**sourceThemes:** badgeClass, chipClass, borderClass, cardClass değerleri AYNEN korunur. Spec bu değerlere referans verir, değiştirmez.
