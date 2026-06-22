const setText = (id, value) => {
    const el = document.getElementById(id)
    if (el) el.textContent = value
}

const setStatus = (id, value, color) => {
    const el = document.getElementById(id)
    if (!el) return
    el.textContent = value
    if (color) el.style.color = color
}

const COLOR = {
    ok: 'var(--status-color-ok)',
    error: 'var(--status-color-error)',
    muted: 'var(--text-muted)',
}

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)

export class PanelUI {
    constructor() {
        this.currentTab = 'chat'
    }

    switchTab(tab) {
        document
            .querySelectorAll('.panel-tab-content')
            .forEach((tabContent) => {
                tabContent.classList.remove('active')
            })
        document.querySelectorAll('.panel-tab').forEach((tab) => {
            tab.classList.remove('active')
        })

        document.querySelector(`#panel-${tab}`).classList.add('active')
        document.querySelector(`#${tab}-container`).classList.add('active')

        this.currentTab = tab
    }
}

export class StatusUI {
    updateConnection(status, isError) {
        const connectionStatus = document.querySelector('#connection-status')
        const dot = document.getElementById('status-dot')
        connectionStatus.innerText = status
        connectionStatus.style.color = isError
            ? 'var(--status-color-error)'
            : 'var(--status-color-ok)'
        dot.classList.toggle('disconnected', isError)
    }

    updateState(state) {
        document.querySelector('#panel-state').textContent = cap(state)
        document.querySelector('#avatar-state').textContent = cap(state)

        const dot = document.querySelector('#status-dot')
        if (dot) {
            const visualStates = ['thinking', 'speaking']
            dot.classList.remove(...visualStates)

            if (visualStates.includes(state)) {
                dot.classList.add(state)
            }
        }
    }

    updateExpression(expression) {
        document.getElementById('avatar-expression').textContent =
            cap(expression)
    }

    updateSpeech(isSpeaking) {
        document.getElementById('speaking-status').textContent = isSpeaking
            ? 'Yes'
            : 'No'
    }

    updatePerformance({ last, avg, llm, tts, firstAudio } = {}) {
        setText('perf-last-time', last ?? '-')
        setText('perf-avg-time', avg ?? '-')
        setText('perf-llm-time', llm ?? '-')
        setText('perf-tts-time', tts ?? '-')
        setText('perf-first-audio-time', firstAudio ?? '-')
    }

    updateContextUsage({ prompt_tokens, context_window, percent_used } = {}) {
        if (!prompt_tokens || !context_window) {
            setText('chat-context', '')
            return
        }
        const pct = percent_used != null ? `${percent_used}% · ` : ''
        setText(
            'chat-context',
            `${pct}${prompt_tokens.toLocaleString()} / ${context_window.toLocaleString()} tokens`
        )
    }

    setProfanityFilter(enabled) {
        document
            .getElementById('mode-filtered')
            .classList.toggle('active', enabled)
        document
            .getElementById('mode-unfiltered')
            .classList.toggle('active', !enabled)
    }

    updateMicButton(isActive) {
        const btn = document.getElementById('microphone-chat-button')
        if (!btn) return
        btn.classList.toggle('active', isActive)
        btn.classList.toggle('stopping', isActive)
        if (!isActive) btn.classList.remove('speaking')
    }

    updateMicSpeaking(isSpeaking) {
        const btn = document.getElementById('microphone-chat-button')
        if (!btn) return
        btn.classList.toggle(
            'speaking',
            isSpeaking && btn.classList.contains('active')
        )
    }

    initMicButtonHover() {
        const btn = document.getElementById('microphone-chat-button')
        if (!btn) return
        btn.addEventListener('mouseenter', () => {
            if (btn.classList.contains('active')) btn.classList.add('stopping')
        })
    }

    setDefaults() {
        this.updateConnection('Disconnected', true)
        this.updateState('idle')
        this.updateExpression('neutral')
        this.updateSpeech(false)
        this.updatePerformance()
        this.updateContextUsage()
        this.setProfanityFilter(true)
    }
}

export class ChatUI {
    constructor() {
        this.messagesContainer = document.getElementById('chat-messages')
    }

    addMessage(text, type = 'user', options = {}) {
        if (!this.messagesContainer) return
        const msg = document.createElement('div')
        msg.className = `chat-message ${type}`

        // external sources get a colored badge and username
        if (options.source && options.source !== 'local') {
            msg.classList.add(`source-${options.source}`)
            if (options.username) {
                const badge = document.createElement('span')
                badge.className = `source-badge ${options.source}`
                badge.textContent =
                    options.source.charAt(0).toUpperCase() +
                    options.source.slice(1)
                msg.appendChild(badge)

                const username = document.createElement('span')
                username.className = 'chat-username'
                username.textContent = options.username + ': '
                if (options.color) username.style.color = options.color
                msg.appendChild(username)
            }
        }

        const textSpan = document.createElement('span')
        textSpan.className = 'chat-text'
        textSpan.textContent = text
        msg.appendChild(textSpan)

        this.messagesContainer.appendChild(msg)
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight
    }

    addTwitchMessage(username, message, badges = [], color = '') {
        this.addMessage(message, 'user', {
            source: 'twitch',
            username,
            color: color || '#9147ff',
            badges,
        })
    }

    showInterimTranscription(text) {
        if (!this.messagesContainer) return
        let interim = this.messagesContainer.querySelector(
            '.chat-message.interim'
        )
        if (!interim) {
            interim = document.createElement('div')
            interim.className = 'chat-message user interim'
            this.messagesContainer.appendChild(interim)
        }
        interim.textContent = text + '...'
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight
    }

    removeInterimTranscription() {
        this.messagesContainer?.querySelector('.chat-message.interim')?.remove()
    }

    // drops the trailing "Thinking..."/"Processing..." placeholder
    removeProcessingMessage() {
        const last = this.messagesContainer?.lastElementChild
        if (
            last?.classList.contains('system') &&
            (last.textContent.includes('Processing') ||
                last.textContent.includes('Thinking'))
        ) {
            last.remove()
        }
    }

    clear() {
        if (this.messagesContainer) {
            this.messagesContainer.innerHTML =
                '<div class="chat-message reminder"><p>Click on the microphone or type a message.</p></div>'
        }
    }

    restore(messages) {
        if (!this.messagesContainer) return
        this.messagesContainer.querySelector('.chat-message.reminder')?.remove()
        for (const m of messages) {
            if (m.user_message) this.addMessage(m.user_message, 'user')
            if (m.assistant_response)
                this.addMessage(m.assistant_response, 'assistant')
        }
    }

    getInputValue() {
        const input = document.getElementById('chat-input')
        if (!input) return ''
        const value = input.value.trim()
        input.value = ''
        return value
    }

    setInputDisabled(disabled) {
        const input = document.getElementById('chat-input')
        const sendBtn = document.getElementById('send-chat-button')
        if (input) input.disabled = disabled
        if (sendBtn) sendBtn.disabled = disabled
    }

    focusInput() {
        document.getElementById('chat-input')?.focus()
    }
}

export class IntegrationsUI {
    // TODO: add updateTwitch({ status, channel }) method
    // TODO: add updateDiscord({ status, voiceChannel }) method
    // TODO: add updateDonation({ enabled, queue }) method
    updateSounds({ count = '-', aliases = '-' } = {}) {
        setText('sounds-count', count)
        setText('sounds-aliases', aliases)
    }

    setDefaults() {
        this.updateSounds()
    }
}

export class LogUI {
    constructor() {
        this.container = document.getElementById('log-messages')
        this.debug = false
    }

    log(message, level = 'info') {
        if (level === 'debug' && !this.debug) return
        if (!this.container) return

        const entry = document.createElement('div')
        entry.className = 'log-entry'

        const time = document.createElement('span')
        time.className = 'log-time'
        const d = new Date()
        time.textContent =
            d.toLocaleDateString('en-US', {
                month: '2-digit',
                day: '2-digit',
            }) +
            ' ' +
            d.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                second: '2-digit',
            })

        const lvl = document.createElement('span')
        lvl.className = `log-level ${level}`
        lvl.textContent = level

        const msg = document.createElement('span')
        msg.className = 'log-msg'
        msg.textContent = message

        entry.append(time, lvl, msg)
        this.container.appendChild(entry)
        this.container.scrollTop = this.container.scrollHeight
    }

    clear() {
        if (this.container) this.container.innerHTML = ''
    }

    toggleDebug() {
        this.debug = !this.debug
        this.log(`Debug logging ${this.debug ? 'on' : 'off'}`, 'event')
        return this.debug
    }
}
