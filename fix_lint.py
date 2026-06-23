import re

with open("src/app/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Replace Date.now() logic
old_date_logic = """              const rtf = new Intl.RelativeTimeFormat("tr", { numeric: "auto" });
              const messageDate = new Date(message.receivedAt);
              const diffInMinutes = Math.round((messageDate.getTime() - Date.now()) / 60000);
              
              let timeText = "";
              if (Math.abs(diffInMinutes) < 60) {
                timeText = rtf.format(diffInMinutes, "minute");
              } else if (Math.abs(diffInMinutes) < 1440) {
                timeText = rtf.format(Math.round(diffInMinutes / 60), "hour");
              } else {
                timeText = new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" }).format(messageDate);
              }"""
new_date_logic = """              const timeText = formatDateTime(message.receivedAt);"""
content = content.replace(old_date_logic, new_date_logic)

# 2. Replace clearMessages with clearScreen
content = content.replace("void clearMessages()", "void clearScreen()")

# 3. Use sourceDisplayLabel instead of channel.label if needed, or just remove sourceDisplayLabel?
# Wait, it's easier to just remove unused variables.
# But sourceDisplayLabel is a function at the top level. Let's just remove it.
content = re.sub(r'const sourceDisplayLabel = \(sourceApp: SourceApp\) =>\n  sourceApp === "Diger" \? "Diğer" : sourceApp;\n\n', '', content)

# 4. Remove brandIconFor if unused (it is unused because I used BrandIcon component)
content = re.sub(r'const brandIconFor = \([^)]+\): SimpleIcon \| undefined => \{[^}]+\};\n\n', '', content)

# 5. Use todayStamp or remove it. It's inside Home component.
# Let's remove todayStamp:
content = re.sub(r'  const todayStamp = useMemo\(\n    \(\) =>\n      new Intl\.DateTimeFormat\("tr-TR", \{\n        day: "2-digit",\n        month: "long",\n        weekday: "long",\n      \}\)\.format\(new Date\(\)\),\n    \[\],\n  \);\n\n', '', content)

with open("src/app/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed lint errors.")
