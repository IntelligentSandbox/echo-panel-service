export class PanelUI {
    constructor() {}

    switchTab(tab) {
        document.querySelectorAll('.panel-tab').forEach((tab) => {
            tab.classList.remove('active')
        })
        tab.classList.add('active')
        console.log('Switching to tab', tab.innerText)
    }
}
