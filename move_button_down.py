import re

with open('src/app/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove the button from the header
header_target = r'<div className="mx-auto flex w-full max-w-\[430px\] items-center justify-between px-4 py-3">\n          <div className="flex items-center gap-2">\n            <button\n              type="button"\n              onClick=\{\(\) => setIsChannelPanelOpen\(true\)\}\n              aria-label="Kanalları ayarla"\n              className="flex items-center gap-2 rounded-full bg-\[var\(--subtle\)\] px-3 py-1\.5 transition active:scale-95"\n            >\n              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-\[var\(--ink-primary\)\] text-\[var\(--paper\)\]">\n                <span className="text-\[10px\] font-black">\{enabledChannelCount\}</span>\n              </div>\n              <span className="text-\[13px\] font-black text-\[var\(--ink-primary\)\]">Kanalları ayarla</span>\n            </button>\n          </div>'
replacement_header = '<div className="mx-auto flex w-full max-w-[430px] items-center justify-end px-4 py-3">'

content = re.sub(header_target, replacement_header, content)

# 2. Insert the button below the tabs
tabs_end_target = r'</button>\n              \);\n            \}\)}\n          </div>\n        </div>\n      </header>\n\n      \{\/\* Main Content Area \*\/\}'

button_html = '''</button>
              );
            })}
          </div>
          
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsChannelPanelOpen(true)}
              aria-label="Kanalları ayarla"
              className="flex items-center gap-2 rounded-full bg-[var(--subtle)] px-3 py-1.5 transition active:scale-95"
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--ink-primary)] text-[var(--paper)]">
                <span className="text-[10px] font-black">{enabledChannelCount}</span>
              </div>
              <span className="text-[13px] font-black text-[var(--ink-primary)]">Kanalları ayarla</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}'''

content = re.sub(tabs_end_target, button_html, content)

with open('src/app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done!')
