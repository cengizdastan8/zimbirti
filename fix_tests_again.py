import re

with open("scripts/web-smoke.mjs", "r", encoding="utf-8") as f:
    smoke_content = f.read()

# Fix "Tüm mesajlar" click
smoke_content = smoke_content.replace(
    "find((button) => (button.textContent || '').includes('Tüm mesajlar'))?.click()",
    "find((button) => (button.textContent || '').includes('Tümü'))?.click()"
)

# Fix clear screen click: We must open the channel panel first because the clear button is inside it now
# Original replacement:
old_clear_cmd = "window.confirm = () => true; Array.from(document.querySelectorAll('button')).find((button) => (button.textContent || '').includes('Tüm Mesajları Temizle'))?.click(); true"

new_clear_cmd = """window.confirm = () => true;
      document.querySelector('button[aria-label=\"Ayarlar\"]')?.click();
      setTimeout(() => {
        Array.from(document.querySelectorAll('button')).find((button) => (button.textContent || '').includes('Tüm Mesajları Temizle'))?.click();
      }, 300);
      true"""

smoke_content = smoke_content.replace(old_clear_cmd, new_clear_cmd.replace('\n', ' '))

# Wait, let's just make the test evaluate look exactly like this:
smoke_content = re.sub(
    r"await evaluate\(`window\.confirm = \(\) => true;.*?\); true`\);",
    "await evaluate(`window.confirm = () => true; document.querySelector('button[aria-label=\"Ayarlar\"]')?.click(); setTimeout(() => { Array.from(document.querySelectorAll('button')).find((button) => (button.textContent || '').includes('Tüm Mesajları Temizle'))?.click(); }, 300); true`); await sleep(500);",
    smoke_content
)

with open("scripts/web-smoke.mjs", "w", encoding="utf-8") as f:
    f.write(smoke_content)

print("Patch complete.")
