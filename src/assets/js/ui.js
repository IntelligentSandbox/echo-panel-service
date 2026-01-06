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
