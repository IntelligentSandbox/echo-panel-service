const AVATAR_URL = 'localhost:8003'

export const CONFIG = {
    wsUrl: `ws://${AVATAR_URL}/ws`,
    apiUrl: `http://${AVATAR_URL}/`,
    reconnectTimer: 5000,
}
