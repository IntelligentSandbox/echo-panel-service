const setText = (id, value) => {
    const el = document.getElementById(id)
    if (el) el.textContent = value
}

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
        document.querySelector('#panel-state').textContent = state
        document.querySelector('#avatar-state').textContent = state

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
        document.getElementById('avatar-expression').textContent = expression
    }

    updateSpeech(isSpeaking) {
        document.getElementById('speaking-status').textContent = isSpeaking
            ? 'Yes'
            : 'No'
    }

    updatePerformance({ last, avg, llm, tts } = {}) {
        setText('perf-last-time', last ?? '-')
        setText('perf-avg-time', avg ?? '-')
        setText('perf-llm-time', llm ?? '-')
        setText('perf-tts-time', tts ?? '-')
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
        this.setProfanityFilter(true)
    }
}

export class IntegrationsUI {
    updateTwitch({ status = 'Disconnected', channel = '-' } = {}) {
        setText('twitch-connection', status)
        setText('twitch-channel', channel)
    }

    updateDiscord({ status = 'Disconnected', voice = '-' } = {}) {
        setText('discord-connection', status)
        setText('discord-voice', voice)
    }

    updateDonation({ status = 'Disabled', queue = '0' } = {}) {
        setText('donation-enabled', status)
        setText('donation-queue', queue)
    }

    updateSounds({ count = '-', aliases = '-' } = {}) {
        setText('sounds-count', count)
        setText('sounds-aliases', aliases)
    }

    // flips the join button between its two labels
    toggleDiscordButton() {
        const btn = document.getElementById('discord-vc-btn')
        const leaving = btn.classList.toggle('leaving')
        btn.textContent = leaving ? 'Leave' : 'Join'
        return leaving
    }

    setDefaults() {
        this.updateTwitch()
        this.updateDiscord()
        this.updateDonation()
        this.updateSounds()
    }
}
