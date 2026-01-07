import { PanelUI } from './ui.js'
import { MemoryUI } from './memory.js'

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
