import { PanelUI, StatusUI } from './ui.js'
import { MemoryUI } from './memory.js'
import { Connect } from './connect.js'
import { CONFIG } from './config.js'

const API = (path) => `${CONFIG.apiUrl}${path}`

const panel = new PanelUI()
const memory = new MemoryUI()
const status = new StatusUI()

document.querySelectorAll('.panel-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
        switchTab(tab.id.replace('panel-', ''))
    })
})

document.querySelectorAll('.memory-sub-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
        switchSubTab(tab.id.replace('mem-tab-', ''))
    })
})

async function toggleMicButton(isActive) {
    console.log('toggleMicButton', isActive)
    status.updateMicButton(isActive)
}

window.switchTab = (tab) => {
    panel.switchTab(tab)
}

window.switchSubTab = (tab) => {
    memory.switchSubTab(tab)
}

document.addEventListener('DOMContentLoaded', () => {
    const connect = new Connect()

    connect.addEventListener('status-change', (e) => {
        status.updateConnection(e.detail.status, e.detail.isError)
    })

    status.initMicButtonHover()

    document.querySelectorAll('#content-mode-buttons button').forEach((btn) => {
        btn.addEventListener('click', () => {
            document
                .querySelectorAll('#content-mode-buttons button')
                .forEach((b) => b.classList.remove('active'))
            btn.classList.add('active')
        })
    })

    document
        .getElementById('microphone-chat-button')
        .addEventListener('click', () => {
            const btn = document.getElementById('microphone-chat-button')
            toggleMicButton(!btn.classList.contains('active'))
        })

    document.getElementById('discord-vc-btn').addEventListener('click', () => {
        const btn = document.getElementById('discord-vc-btn')
        const joined = btn.classList.toggle('leaving')
        btn.textContent = joined ? 'Leave' : 'Join'
    })

    connect.connect()
})
