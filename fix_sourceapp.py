import re

with open('src/app/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('sourceApp: "Telegram"', 'sourceApp: "Diger"')
content = content.replace('sourceApp: "E-Posta"', 'sourceApp: "Diger"')

with open('src/app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed SourceApp types!")
