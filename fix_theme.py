import re

with open('src/app/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

state_old = '''  const [isNotificationAccessEnabled, setIsNotificationAccessEnabled] =
    useState<boolean | null>(null);
  const hasLoadedStorage = useRef(false);'''

state_new = '''  const [isNotificationAccessEnabled, setIsNotificationAccessEnabled] =
    useState<boolean | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const hasLoadedStorage = useRef(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("tekpanel:theme");
      if (stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
        document.documentElement.classList.add("dark");
        window.setTimeout(() => setIsDarkMode(true), 0);
      }
    } catch {}
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("tekpanel:theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("tekpanel:theme", "light");
      }
      return next;
    });
  }, []);'''

content = content.replace(state_old, state_new)

with open('src/app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Injected toggleTheme.")
