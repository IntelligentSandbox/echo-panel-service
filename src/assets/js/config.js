const AVATAR_URL = 'localhost:8003'

export const CONFIG = {
    wsUrl: `ws://${AVATAR_URL}/ws`,
    apiUrl: `http://${AVATAR_URL}/`, // TODO(d2a8): change to /api
    reconnectTimer: 5000,
}
