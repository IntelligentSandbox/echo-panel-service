import { PanelUI } from './ui.js'

const panel = new PanelUI()

window.switchTab = (tab) => {
    panel.switchTab(tab)
}

document.querySelectorAll('.panel-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
        window.switchTab(tab)
    })
})
