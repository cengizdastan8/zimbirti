import re

with open("scripts/web-smoke.mjs", "r", encoding="utf-8") as f:
    smoke_content = f.read()

bad_eval = """await evaluate(`window.confirm = () => true;       document.querySelector('button[aria-label="Ayarlar"]')?.click();       setTimeout(() => {         Array.from(document.querySelectorAll('button')).find((button) => (button.textContent || '').includes('Tüm Mesajları Temizle'))?.click();       }, 300);       true`);"""

good_eval = """await evaluate(`new Promise((resolve) => { window.confirm = () => true; document.querySelector('button[aria-label="Ayarlar"]')?.click(); setTimeout(() => { Array.from(document.querySelectorAll('button')).find((button) => (button.textContent || '').includes('Tüm Mesajları Temizle'))?.click(); resolve(true); }, 300); })`); await sleep(300);"""

smoke_content = smoke_content.replace(bad_eval, good_eval)

with open("scripts/web-smoke.mjs", "w", encoding="utf-8") as f:
    f.write(smoke_content)

print("Promise patch applied.")
