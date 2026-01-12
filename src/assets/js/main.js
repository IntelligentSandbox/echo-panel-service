import { PanelUI, StatusUI } from './ui.js'
import { MemoryUI } from './memory.js'
import { Connect } from './connect.js'
import { CONFIG } from './config.js'

const API = (path) => `${CONFIG.apiUrl}${path}`

const panel = new PanelUI()
const memory = new MemoryUI()

window.switchTab = (tab) => {
    panel.switchTab(tab)
}

window.switchSubTab = (tab) => {
    memory.switchSubTab(tab)
}

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

document.addEventListener('DOMContentLoaded', () => {
    const status = new StatusUI()
    const connect = new Connect()

    connect.addEventListener('status-change', (e) => {
        status.updateConnection(e.detail.status, e.detail.isError)
    })

    connect.connect()
})
