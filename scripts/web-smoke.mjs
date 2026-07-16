import { createServer } from "node:http";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";

const root = resolve("out");
const storageKey = "tekpanel:phase1:messages";

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".ico", "image/x-icon"],
]);

function serveStatic() {
  const server = createServer((request, response) => {
    const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");
    const pathname =
      decodeURIComponent(requestUrl.pathname) === "/"
        ? "/index.html"
        : decodeURIComponent(requestUrl.pathname);

    try {
      const filePath = join(root, pathname);
      const body = readFileSync(filePath);
      const ext = filePath.slice(filePath.lastIndexOf("."));
      response.writeHead(200, {
        "content-type": mimeTypes.get(ext) ?? "application/octet-stream",
      });
      response.end(body);
    } catch {
      response.writeHead(404, { "content-type": "text/plain" });
      response.end("not found");
    }
  });

  return new Promise((resolveServer) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolveServer({
        close: () => new Promise((resolveClose) => server.close(resolveClose)),
        url: `http://127.0.0.1:${address.port}`,
      });
    });
  });
}

const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms));

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${url}`);
  }
  return response.json();
}

async function waitForBrowser(debugPort) {
  const deadline = Date.now() + 12000;
  while (Date.now() < deadline) {
    try {
      return await fetchJson(`http://127.0.0.1:${debugPort}/json/version`);
    } catch {
      await sleep(200);
    }
  }
  throw new Error("Chrome debug endpoint did not start.");
}

function connectCdp(wsUrl) {
  const socket = new WebSocket(wsUrl);
  let nextId = 1;
  const pending = new Map();

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(String(event.data));
    if (message.id && pending.has(message.id)) {
      const { resolve: resolvePending, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) {
        reject(new Error(message.error.message));
      } else {
        resolvePending(message.result);
      }
    }
  });

  return new Promise((resolveConnection, rejectConnection) => {
    socket.addEventListener("open", () => {
      resolveConnection({
        send(method, params = {}) {
          const id = nextId++;
          socket.send(JSON.stringify({ id, method, params }));
          return new Promise((resolvePending, reject) => {
            pending.set(id, { resolve: resolvePending, reject });
          });
        },
        close() {
          socket.close();
        },
      });
    });
    socket.addEventListener("error", rejectConnection);
  });
}

async function openBrowser(url) {
  const debugPort = 9333 + Math.floor(Math.random() * 400);
  const userDataDir = mkdtempSync(join(tmpdir(), "tekpanel-web-smoke-"));
  const chromeCandidates = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ];
  const chromePath = chromeCandidates.find((candidate) => {
    try {
      readFileSync(candidate);
      return true;
    } catch {
      return false;
    }
  });
  if (!chromePath) {
    throw new Error("Chrome or Edge not found for smoke test.");
  }

  const browser = spawn(
    chromePath,
    [
      "--headless=new",
      `--remote-debugging-port=${debugPort}`,
      `--user-data-dir=${userDataDir}`,
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
      "about:blank",
    ],
    { stdio: "ignore" },
  );

  await waitForBrowser(debugPort);
  const target = await fetchJson(`http://127.0.0.1:${debugPort}/json/new?${url}`, {
    method: "PUT",
  });
  const cdp = await connectCdp(target.webSocketDebuggerUrl);

  return {
    cdp,
    async close() {
      cdp.close();
      browser.kill();
      await sleep(500);
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          rmSync(userDataDir, { force: true, recursive: true });
          return;
        } catch {
          await sleep(500);
        }
      }
    },
  };
}

async function main() {
  const server = await serveStatic();
  const browser = await openBrowser(server.url);
  const { cdp } = browser;

  try {
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      deviceScaleFactor: 2,
      height: 844,
      mobile: true,
      width: 390,
    });

    const evaluate = async (expression) => {
      const result = await cdp.send("Runtime.evaluate", {
        awaitPromise: true,
        expression,
        returnByValue: true,
      });
      if (result.exceptionDetails) {
        throw new Error(result.exceptionDetails.text);
      }
      return result.result.value;
    };

    const reloadPage = async () => {
      await cdp.send("Page.reload", { ignoreCache: true });
      await sleep(1200);
    };

    await cdp.send("Page.navigate", { url: server.url });
    await sleep(1500);
    await evaluate("localStorage.clear(); true");
    await reloadPage();

    const initial = await evaluate(`({
      hasTitle: document.body.innerText.includes('TekPanel'),
      hasNoEmptyCopy: !document.body.innerText.includes('Bildirim bekleniyor') && !document.body.innerText.includes('WhatsApp, Instagram'),
      hasChannelButton: Boolean(document.querySelector('button[aria-label="Kanalları ayarla"]')),
      hasClearButton: Boolean(document.querySelector('button[aria-label="Ekranı temizle"]')),
      hasAllFilter: (document.body.textContent || '').includes('Tümü'),
      hasNoInputs: document.querySelectorAll('input, textarea, select').length === 0,
      hasNoOverflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth
    })`);

    await evaluate(`document.querySelector('button[aria-label="Kanalları ayarla"]')?.click(); true`);
    await sleep(300);

    const channelPanel = await evaluate(`({
      hasTitle: (document.body.textContent || '').includes('Kanallar'),
      hasWhatsapp: (document.body.textContent || '').includes('WhatsApp'),
      hasBusiness: (document.body.textContent || '').includes('WhatsApp Business'),
      hasEnableAllButton: (document.body.textContent || '').includes('Tüm kanallar'),
      hasScanButton: (document.body.textContent || '').includes('Kanal ekle'),
      hasNoInputs: document.querySelectorAll('input, textarea, select').length === 0,
      hasNoOverflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth
    })`);

    await evaluate(`Array.from(document.querySelectorAll('button')).find((button) => {
      const text = button.textContent || '';
      return text.includes('WhatsApp Business');
    })?.click(); true`);
    await sleep(300);

    const channelToggle = await evaluate(`({
      storedChannels: JSON.parse(localStorage.getItem('tekpanel:enabledChannels') || '[]'),
      hasClosedLabel: (document.body.textContent || '').includes('Kapalı'),
      hasNoInputs: document.querySelectorAll('input, textarea, select').length === 0,
      hasNoOverflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth
    })`);

    await evaluate(`Array.from(document.querySelectorAll('button')).find((button) => (button.textContent || '').includes('Tüm kanallar'))?.click(); true`);
    await sleep(300);

    const enableAllChannels = await evaluate(`({
      storedChannels: JSON.parse(localStorage.getItem('tekpanel:enabledChannels') || '[]'),
      hasNoClosedLabel: !(document.body.textContent || '').includes('Kapalı'),
      hasNoInputs: document.querySelectorAll('input, textarea, select').length === 0,
      hasNoOverflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth
    })`);

    await evaluate(`Array.from(document.querySelectorAll('button')).find((button) => (button.textContent || '').includes('Kapat'))?.click(); true`);
    await sleep(300);

    const messages = [
      {
        id: "native-whatsapp-1",
        sourceApp: "WhatsApp",
        sourcePackage: "com.whatsapp",
        senderName: "Cem Usta",
        messageText: "Randevu var mi? Yarin ogleden sonra musaitseniz gelmek istiyorum. Uygunsa saat bilgisini yazar misiniz?",
        receivedAt: new Date().toISOString(),
        captureMethod: "notification",
        status: "new",
        priority: "medium",
        notes: "",
        nextAction: "Cevap ver",
        followUpDate: new Date().toISOString().slice(0, 10),
        customerId: "WhatsApp:cem usta",
      },
      {
        id: "native-instagram-1",
        sourceApp: "Instagram",
        sourcePackage: "com.instagram.android",
        senderName: "Derya",
        messageText: "Fiyat alabilir miyim?",
        receivedAt: new Date(Date.now() - 3600000).toISOString(),
        captureMethod: "notification",
        status: "new",
        priority: "medium",
        notes: "",
        nextAction: "Cevap ver",
        followUpDate: new Date().toISOString().slice(0, 10),
        customerId: "Instagram:derya",
      },
      {
        id: "share-note-1",
        sourceApp: "SMS",
        sourcePackage: "com.google.android.apps.messaging",
        senderName: "Murat",
        messageText: "Adres nerede?",
        receivedAt: new Date(Date.now() - 7200000).toISOString(),
        captureMethod: "share",
        status: "new",
        priority: "medium",
        notes: "",
        nextAction: "Cevap ver",
        followUpDate: new Date().toISOString().slice(0, 10),
        customerId: "SMS:murat",
      },
    ];

    await evaluate(`localStorage.setItem('${storageKey}', ${JSON.stringify(JSON.stringify(messages))}); true`);
    await reloadPage();

    const seeded = await evaluate(`({
      storedCount: JSON.parse(localStorage.getItem('${storageKey}') || '[]').length,
      hasCem: document.body.innerText.includes('Cem Usta') && document.body.innerText.includes('Randevu var mi?'),
      hasDerya: document.body.innerText.includes('Derya') && document.body.innerText.includes('Fiyat alabilir miyim?'),
      hasMurat: document.body.innerText.includes('Murat') && document.body.innerText.includes('Adres nerede?'),
      hasOkunduButton: Array.from(document.querySelectorAll('button')).some((button) => (button.textContent || '').includes('Okundu')),
      hasAllFilter: (document.body.textContent || '').includes('Tümü'),
      hasNoPackageText: !document.body.innerText.includes('com.whatsapp') && !document.body.innerText.includes('com.instagram.android'),
      hasNoInputs: document.querySelectorAll('input, textarea, select').length === 0,
      hasNoOverflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth
    })`);

    await evaluate(`Array.from(document.querySelectorAll('button')).find((button) => (button.textContent || '').includes('Instagram'))?.click(); true`);
    await sleep(300);

    const instagramFilter = await evaluate(`({
      hasDerya: document.body.innerText.includes('Derya') && document.body.innerText.includes('Fiyat alabilir miyim?'),
      hasNoCem: !document.body.innerText.includes('Cem Usta'),
      hasNoMurat: !document.body.innerText.includes('Murat'),
      hasNoOverflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth
    })`);

    await evaluate(`Array.from(document.querySelectorAll('button')).find((button) => (button.textContent || '').includes('Tümü'))?.click(); true`);
    await sleep(300);

    const allFilter = await evaluate(`({
      hasCem: document.body.innerText.includes('Cem Usta'),
      hasDerya: document.body.innerText.includes('Derya'),
      hasMurat: document.body.innerText.includes('Murat'),
      hasNoOverflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth
    })`);

    await evaluate(`Array.from(document.querySelectorAll('button')).find((button) => (button.textContent || '').includes('Okundu'))?.click(); true`);
    await reloadPage();

    const afterRead = await evaluate(`({
      storedCount: JSON.parse(localStorage.getItem('${storageKey}') || '[]').length,
      hasCem: document.body.innerText.includes('Cem Usta'),
      hasNoInputs: document.querySelectorAll('input, textarea, select').length === 0,
      hasNoOverflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth
    })`);

    await evaluate(`window.confirm = () => true; document.querySelector('button[aria-label="Ekranı temizle"]')?.click(); true`);
    await sleep(500);
    await reloadPage();

    const afterClear = await evaluate(`({
      storedCount: JSON.parse(localStorage.getItem('${storageKey}') || '[]').length,
      hasTitle: document.body.innerText.includes('TekPanel'),
      hasNoEmptyCopy: !document.body.innerText.includes('Bildirim bekleniyor') && !document.body.innerText.includes('WhatsApp, Instagram'),
      hasNoInputs: document.querySelectorAll('input, textarea, select').length === 0,
      hasNoOverflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth
    })`);

    await evaluate(`localStorage.setItem('${storageKey}', '{bad json'); true`);
    await reloadPage();

    const corruptedStorageFallback = await evaluate(`({
      hasTitle: document.body.innerText.includes('TekPanel'),
      hasNoEmptyCopy: !document.body.innerText.includes('Bildirim bekleniyor') && !document.body.innerText.includes('WhatsApp, Instagram'),
      storedCount: JSON.parse(localStorage.getItem('${storageKey}') || '[]').length,
      hasNoInputs: document.querySelectorAll('input, textarea, select').length === 0,
      hasNoOverflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth
    })`);

    const result = {
      afterClear,
      afterRead,
      allFilter,
      channelPanel,
      channelToggle,
      corruptedStorageFallback,
      enableAllChannels,
      initial,
      instagramFilter,
      seeded,
    };

    const assertions = [
      initial.hasTitle,
      initial.hasNoEmptyCopy,
      initial.hasChannelButton,
      initial.hasClearButton,
      initial.hasAllFilter,
      initial.hasNoInputs,
      initial.hasNoOverflow,
      channelPanel.hasTitle,
      channelPanel.hasWhatsapp,
      channelPanel.hasBusiness,
      channelPanel.hasEnableAllButton,
      channelPanel.hasScanButton,
      channelPanel.hasNoInputs,
      channelPanel.hasNoOverflow,
      !channelToggle.storedChannels.includes("com.whatsapp.w4b"),
      channelToggle.hasClosedLabel,
      channelToggle.hasNoInputs,
      channelToggle.hasNoOverflow,
      enableAllChannels.storedChannels.includes("com.whatsapp.w4b"),
      enableAllChannels.hasNoClosedLabel,
      enableAllChannels.hasNoInputs,
      enableAllChannels.hasNoOverflow,
      seeded.storedCount === 3,
      seeded.hasCem,
      seeded.hasDerya,
      seeded.hasMurat,
      seeded.hasOkunduButton,
      seeded.hasAllFilter,
      seeded.hasNoPackageText,
      seeded.hasNoInputs,
      seeded.hasNoOverflow,
      instagramFilter.hasDerya,
      instagramFilter.hasNoCem,
      instagramFilter.hasNoMurat,
      instagramFilter.hasNoOverflow,
      allFilter.hasCem,
      allFilter.hasDerya,
      allFilter.hasMurat,
      allFilter.hasNoOverflow,
      afterRead.storedCount === 2,
      !afterRead.hasCem,
      afterRead.hasNoInputs,
      afterRead.hasNoOverflow,
      afterClear.storedCount === 0,
      afterClear.hasTitle,
      afterClear.hasNoEmptyCopy,
      afterClear.hasNoInputs,
      afterClear.hasNoOverflow,
      corruptedStorageFallback.hasTitle,
      corruptedStorageFallback.hasNoEmptyCopy,
      corruptedStorageFallback.storedCount === 0,
      corruptedStorageFallback.hasNoInputs,
      corruptedStorageFallback.hasNoOverflow,
    ];

    if (assertions.some((value) => !value)) {
      console.log(JSON.stringify(result, null, 2));
      throw new Error("Web smoke assertion failed.");
    }

    console.log(JSON.stringify(result, null, 2));
  } finally {
    await browser.close();
    await server.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
