import { CONFIG } from './config.js'

export class Connect extends EventTarget {
    constructor() {
        super()
        this.config = CONFIG
        this.ws = null
        this.reconnectTimeout = null
    }

    connect() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) return

        this.ws = new WebSocket(this.config.wsUrl)

        this.ws.onopen = () => {
            this.emit('status-change', { status: 'Connected', isError: false })
            this.send({ action: 'get_status' })
        }

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data)
                if (data.type === 'ping') return this.send({ action: 'pong' })

                this.dispatchEvent(new CustomEvent('message', { detail: data }))
            } catch (e) {
                console.error('Parse error', e)
            }
        }

        this.ws.onclose = () => {
            this.emit('status-change', {
                status: 'Disconnected',
                isError: true,
            })
            this.reconnect()
        }

        this.ws.onerror = () =>
            this.emit('status-change', { status: 'Error', isError: true })
    }

    emit(type, detail) {
        this.dispatchEvent(new CustomEvent(type, { detail }))
    }

    send(data) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data))
        }
    }

    reconnect() {
        clearTimeout(this.reconnectTimeout)
        this.reconnectTimeout = setTimeout(
            () => this.connect(),
            CONFIG.reconnectTimer
        )
    }
}
