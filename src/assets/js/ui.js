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
}
