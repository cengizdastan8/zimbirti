import re

with open("scripts/android-build.ps1", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("Invoke-WebRequest `", "Invoke-WebRequest -UseBasicParsing `")

with open("scripts/android-build.ps1", "w", encoding="utf-8") as f:
    f.write(content)

print("Patch applied.")
