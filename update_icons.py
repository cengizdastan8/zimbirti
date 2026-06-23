import os
from PIL import Image

src_img_path = r"C:\Users\Mel\.gemini\antigravity-ide\brain\4d1a60f7-a2e0-4bbf-af0b-03529c209f98\isolated_arrows_logo_1782219959282.png"
android_res_path = r"C:\Users\Mel\cereb\tekpanel\android\app\src\main\res"

sizes = {
    "mdpi": 48,
    "hdpi": 72,
    "xhdpi": 96,
    "xxhdpi": 144,
    "xxxhdpi": 192
}

if not os.path.exists(src_img_path):
    print("Source image not found!")
    exit(1)

img = Image.open(src_img_path)

# Update Android icons
for dpi, size in sizes.items():
    folder = os.path.join(android_res_path, f"mipmap-{dpi}")
    if not os.path.exists(folder):
        os.makedirs(folder)
    
    resized_img = img.resize((size, size), Image.Resampling.LANCZOS)
    
    resized_img.save(os.path.join(folder, "ic_launcher.png"))
    resized_img.save(os.path.join(folder, "ic_launcher_round.png"))
    resized_img.save(os.path.join(folder, "ic_launcher_foreground.png"))

print("Android icons updated.")

# Update PWA/Web icon if exists
web_icon_path = r"C:\Users\Mel\cereb\tekpanel\public\icon.png"
if os.path.exists(os.path.dirname(web_icon_path)):
    img.resize((512, 512), Image.Resampling.LANCZOS).save(web_icon_path)
    print("Web icon updated.")

