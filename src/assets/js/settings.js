const KEY = 'echo-panel-settings'
const THEMES = ['dark', 'midnight']
const DEFAULTS = { scale: 1, theme: 'dark' }

export function loadSettings() {
    try {
        const saved = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }
        // guard against stale values from older builds
        if (!(saved.scale >= 0.5 && saved.scale <= 2)) saved.scale = DEFAULTS.scale
        if (!THEMES.includes(saved.theme)) saved.theme = DEFAULTS.theme
        return saved
    } catch {
        return { ...DEFAULTS }
    }
}

export function saveSettings(settings) {
    localStorage.setItem(KEY, JSON.stringify(settings))
}

export function applySettings(settings) {
    document.documentElement.style.fontSize = `${16 * settings.scale}px`
    document.documentElement.dataset.theme = settings.theme
}
