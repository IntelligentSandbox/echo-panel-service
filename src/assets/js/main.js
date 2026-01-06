import { PanelUI } from './ui.js'

const panel = new PanelUI()

window.switchTab = (tab) => {
    console.log(tab)
    panel.switchTab(tab)
}

document.querySelectorAll('.panel-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
        switchTab(tab.id.replace('panel-', ''))
    })
})
