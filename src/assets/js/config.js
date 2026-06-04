const host = window.location.hostname
const AVATAR_URL = `${host}:47103`
const MEMORY_URL = `${host}:47104`

export const CONFIG = {
    wsUrl: `ws://${AVATAR_URL}/ws`,
    apiUrl: `http://${AVATAR_URL}`,
    memoryApiUrl: `http://${MEMORY_URL}`,
    reconnectTimer: 5000,
}
