export class MemoryUI {
    constructor() {
        this.currentSubTab = 'list'
    }

    switchSubTab(tab) {
        this.currentSubTab = tab
        document.querySelectorAll('.memory-sub-tab').forEach((tab) => {
            tab.classList.remove('active')
        })

        document.querySelector(`#mem-tab-${tab}`).classList.add('active')

        if (this.renderSubTab) this.renderSubTab()
    }

    renderSubTab() {
        switch (this.currentSubTab) {
            case 'list':
                console.log('Rendering list')
                break
            case 'conversation':
                console.log('Rendering conversation')
                break
            case 'user':
                console.log('Rendering user')
                break
            case 'add':
                console.log('Rendering add')
                break
            default:
                break
        }
    }
}
