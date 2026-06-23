import re

# Fix page.tsx
with open("src/app/page.tsx", "r", encoding="utf-8") as f:
    page_content = f.read()

page_content = page_content.replace(
    "{sortedMessages.length} mesaj",
    "{visibleMessages.length} mesaj"
)

with open("src/app/page.tsx", "w", encoding="utf-8") as f:
    f.write(page_content)


# Fix web-smoke.mjs
with open("scripts/web-smoke.mjs", "r", encoding="utf-8") as f:
    smoke_content = f.read()

smoke_content = smoke_content.replace(
    "find((button) => (button.textContent || '').includes('Okundu'))?.click()",
    "find((button) => button.getAttribute('aria-label') === 'Okundu')?.click()"
)

with open("scripts/web-smoke.mjs", "w", encoding="utf-8") as f:
    f.write(smoke_content)

print("Final patch complete.")
