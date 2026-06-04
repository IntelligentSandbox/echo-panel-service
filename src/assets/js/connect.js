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
            this.sendAction('get_state')
        }

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data)
                if (data.type === 'ping') return this.send({ type: 'pong' })

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

    // sends a command action to the avatar over the socket
    sendAction(action, params = {}) {
        this.send({ action, ...params })
    }

    reconnect() {
        clearTimeout(this.reconnectTimeout)
        this.reconnectTimeout = setTimeout(
            () => this.connect(),
            CONFIG.reconnectTimer
        )
    }
}

// listens nonstop and hands back an audio blob each time speech is detected
export class ContinuousListener {
    constructor() {
        this.isListening = false
        this.mediaRecorder = null
        this.audioChunks = []
        this.audioContext = null
        this.micStream = null
        this.speechStartTime = null
        this.isSpeechActive = false
        this.onSpeechStart = null
        this.onSpeechEnd = null
        this.onAudioReady = null
        this.onError = null
    }

    async start() {
        if (this.isListening) return true
        try {
            this.micStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                },
            })
            this.audioContext = new (
                window.AudioContext || window.webkitAudioContext
            )()
            const source = this.audioContext.createMediaStreamSource(
                this.micStream
            )
            const processor = this.audioContext.createScriptProcessor(
                4096,
                1,
                1
            )
            this.mediaRecorder = new MediaRecorder(this.micStream)
            this.audioChunks = []
            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) this.audioChunks.push(e.data)
            }

            let silenceFrames = 0
            let processing = false
            processor.onaudioprocess = async (e) => {
                if (!this.isListening || processing) return
                const input = e.inputBuffer.getChannelData(0)
                let sum = 0
                for (let i = 0; i < input.length; i++) {
                    sum += input[i] * input[i]
                }
                const energy = Math.sqrt(sum / input.length)
                const speaking = energy > 0.015

                if (speaking && !this.isSpeechActive) {
                    this.isSpeechActive = true
                    silenceFrames = 0
                    this.speechStartTime = Date.now()
                    this.audioChunks = []
                    if (this.mediaRecorder.state === 'inactive') {
                        this.mediaRecorder.start(100)
                    }
                    this.onSpeechStart?.()
                } else if (this.isSpeechActive) {
                    silenceFrames = speaking ? 0 : silenceFrames + 1
                    if (silenceFrames >= 12) {
                        const duration = Date.now() - this.speechStartTime
                        this.isSpeechActive = false
                        silenceFrames = 0
                        if (this.mediaRecorder.state === 'recording') {
                            processing = true
                            this.mediaRecorder.stop()
                            // let the recorder flush its final chunk
                            await new Promise((r) => setTimeout(r, 300))
                            if (this.audioChunks.length > 0 && duration > 500) {
                                await this.onAudioReady?.(
                                    new Blob(this.audioChunks, {
                                        type: 'audio/webm',
                                    })
                                )
                            }
                            this.audioChunks = []
                            processing = false
                            this.onSpeechEnd?.()
                        }
                    }
                }
            }

            source.connect(processor)
            processor.connect(this.audioContext.destination)
            this.isListening = true
            return true
        } catch (e) {
            this.onError?.(e)
            return false
        }
    }

    stop() {
        this.isListening = false
        this.isSpeechActive = false
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop()
        }
        this.mediaRecorder = null
        if (this.micStream) {
            this.micStream.getTracks().forEach((t) => t.stop())
            this.micStream = null
        }
        if (this.audioContext) {
            this.audioContext.close()
            this.audioContext = null
        }
        this.audioChunks = []
    }
}
