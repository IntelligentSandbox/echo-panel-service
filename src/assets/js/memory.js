export class MemoryUI {
    constructor() {
        this.currentSubTab = 'list'
        this.views = {
            list: document.getElementById('memory-view-list'),
            conversation: document.getElementById('memory-view-conversation'),
            user: document.getElementById('memory-view-user'),
            add: document.getElementById('memory-view-add'),
        }
        document.getElementById('submit-memory-btn').addEventListener('click', () => this.submitNewMemory())
    }

    switchSubTab(tab) {
        this.currentSubTab = tab
        document.querySelectorAll('.memory-sub-tab').forEach((t) => t.classList.remove('active'))
        document.getElementById(`mem-tab-${tab}`).classList.add('active')
        this.renderSubTab()
    }

    renderSubTab() {
        Object.values(this.views).forEach((v) => v?.classList.add('memory-view-hidden'))
        this.views[this.currentSubTab]?.classList.remove('memory-view-hidden')
    }

    submitNewMemory() {
        const content = document.getElementById('add-memory-content').value.trim()
        const type = document.getElementById('add-memory-type').value
        if (!content) return
        console.log('TODO(270e): post memory', { content, type })
    }
}
