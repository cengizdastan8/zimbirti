import re

# 1. Patch page.tsx
with open("src/app/page.tsx", "r", encoding="utf-8") as f:
    page_content = f.read()

# Add aria-label to channel filter button
page_content = page_content.replace(
    'onClick={() => setSelectedChannelPackage(channel.packageName)}',
    'onClick={() => setSelectedChannelPackage(channel.packageName)}\n                    aria-label={channel.label}'
)

# Add aria-label to Kapat button
page_content = page_content.replace(
    '<button\n                type="button"\n                onClick={() => setIsChannelPanelOpen(false)}\n                className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--subtle)] text-[var(--ink-primary)] transition active:scale-95"\n              >',
    '<button\n                type="button"\n                onClick={() => setIsChannelPanelOpen(false)}\n                aria-label="Kapat"\n                className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--subtle)] text-[var(--ink-primary)] transition active:scale-95"\n              >'
)

with open("src/app/page.tsx", "w", encoding="utf-8") as f:
    f.write(page_content)

# 2. Patch web-smoke.mjs
with open("scripts/web-smoke.mjs", "r", encoding="utf-8") as f:
    smoke_content = f.read()

smoke_replacements = {
    "includes('Gelen mesajlar')": "includes('Gelenler')",
    "includes('Mesaj bildirimi bekleniyor') && document.body.innerText.includes('görünecek')": "includes('Gelen Kutusu Boş') && document.body.innerText.includes('Yeni mesajlar')",
    "(document.body.textContent || '').includes('Kanalları ayarla')": "document.querySelector('button[aria-label=\"Ayarlar\"]') !== null",
    "(document.body.textContent || '').includes('Tüm mesajlar')": "(document.body.textContent || '').includes('Tümü')",
    "document.querySelector('button[aria-label=\"Kanalları ayarla\"]')?.click()": "document.querySelector('button[aria-label=\"Ayarlar\"]')?.click()",
    "hasTitle: (document.body.textContent || '').includes('Kanalları ayarla')": "hasTitle: (document.body.textContent || '').includes('Kanallar')",
    "includes('Tümünü aç')": "includes('Tümünü Seç')",
    "includes('Menüyü gizle')": "includes('Kapat') || document.querySelector('button[aria-label=\"Kapat\"]')",
    "includes('3 mesaj yakalandı')": "includes('3 mesaj')",
    "some((button) => (button.textContent || '').includes('Okundu'))": "some((button) => button.getAttribute('aria-label') === 'Okundu')",
    "find((button) => (button.textContent || '').includes('Instagram'))": "find((button) => button.getAttribute('aria-label') === 'Instagram')",
    "includes('Instagram: 1 mesaj görünüyor')": "includes('1 mesaj')", # I removed the "Instagram: " text from the top, it just says "1 mesaj" now
    "includes('2 mesaj yakalandı')": "includes('2 mesaj')",
    "document.querySelector('button[aria-label=\"Ekranı tertemiz yap\"]')?.click()": "Array.from(document.querySelectorAll('button')).find((button) => (button.textContent || '').includes('Tüm Mesajları Temizle'))?.click()",
    "hasEmptyCopy: document.body.innerText.includes('Mesaj bildirimi bekleniyor')": "hasEmptyCopy: document.body.innerText.includes('Gelen Kutusu Boş')"
}

for old, new in smoke_replacements.items():
    smoke_content = smoke_content.replace(old, new)

# Special fix for the Kapat button click
smoke_content = smoke_content.replace(
    "Array.from(document.querySelectorAll('button')).find((button) => (button.textContent || '').includes('Kapat') || document.querySelector('button[aria-label=\"Kapat\"]'))?.click(); true",
    "document.querySelector('button[aria-label=\"Kapat\"]')?.click(); true"
)

with open("scripts/web-smoke.mjs", "w", encoding="utf-8") as f:
    f.write(smoke_content)

print("Patch complete.")
