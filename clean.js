const fs = require('fs');
let code = fs.readFileSync('c:/Users/Mel/cereb/tekpanel/src/app/page.tsx', 'utf8');

// Remove the TekPanel logo
code = code.replace(/<p className="flex items-center gap-1\.5 text-\[11px\] font-black uppercase tracking-\[0\.2em\] text-\[var\(--ink-muted\)\]">\s*<span className="inline-block h-1\.5 w-1\.5 rounded-full bg-\[var\(--accent-bg\)\]" \/>\s*TekPanel\s*<\/p>/g, '');

// Remove borders
code = code.replace(/border-b border-\[var\(--border-strong\)\]/g, '');
code = code.replace(/border border-\[var\(--border-strong\)\]/g, '');
code = code.replace(/border-dashed/g, '');
code = code.replace(/border-t border-\[var\(--border-strong\)\]/g, '');
code = code.replace(/border-r border-\[var\(--border-strong\)\]/g, '');
code = code.replace(/border-2 border-black/g, '');

fs.writeFileSync('c:/Users/Mel/cereb/tekpanel/src/app/page.tsx', code);
console.log("Done");
