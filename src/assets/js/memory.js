import { CONFIG } from './config.js'

const USER_FIELDS = ['name', 'nickname', 'timezone', 'interests']
const REQUIRED_USER_FIELDS = ['name']

// the browser ships the full iana list, so we do not hardcode zones
function timezoneOptions() {
    try {
        return Intl.supportedValuesOf('timeZone')
    } catch {
        return [Intl.DateTimeFormat().resolvedOptions().timeZone].filter(Boolean)
    }
}

export class MemoryUI {
    constructor() {
        this.apiUrl = CONFIG.memoryApiUrl
        this.currentSubTab = 'list'
        this.onMessage = null
        this.views = {
            list: document.getElementById('memory-view-list'),
            conversation: document.getElementById('memory-view-conversation'),
            user: document.getElementById('memory-view-user'),
            add: document.getElementById('memory-view-add'),
        }
        document
            .getElementById('submit-memory-btn')
            .addEventListener('click', () => this.submitNewMemory())
    }

    setDefaults() {
        const lt = document.getElementById('stat-long-term')
        const st = document.getElementById('stat-short-term')
        if (lt) lt.textContent = '-'
        if (st) st.textContent = '-'
    }

    async fetchStats() {
        try {
            return await (await fetch(`${this.apiUrl}/stats`)).json()
        } catch (e) {
            return { long_term_memories: 0, short_term_messages: 0 }
        }
    }

    async updateStatsDisplay() {
        const lt = document.getElementById('stat-long-term')
        const st = document.getElementById('stat-short-term')
        try {
            const data = await this.fetchStats()
            if (lt) lt.textContent = data.long_term_memories ?? 0
            if (st) st.textContent = data.short_term_messages ?? 0
        } catch (e) {
            if (lt) lt.textContent = '?'
            if (st) st.textContent = '?'
        }
    }

    switchSubTab(tab) {
        this.currentSubTab = tab
        document
            .querySelectorAll('.memory-sub-tab')
            .forEach((t) => t.classList.remove('active'))
        document.getElementById(`mem-tab-${tab}`).classList.add('active')
        this.renderSubTab()
    }

    renderSubTab() {
        Object.values(this.views).forEach((v) =>
            v?.classList.add('memory-view-hidden')
        )
        this.views[this.currentSubTab]?.classList.remove('memory-view-hidden')

        if (this.currentSubTab === 'list') this.renderMemoriesList()
        else if (this.currentSubTab === 'conversation')
            this.renderConversation()
        else if (this.currentSubTab === 'user') this.renderUserInfo()
    }

    async renderMemoriesList() {
        const container = this.views.list
        if (!container) return
        container.innerHTML = '<div class="empty-state">Loading...</div>'
        try {
            const data = await (
                await fetch(`${this.apiUrl}/memories?limit=50`)
            ).json()
            const memories = data.memories || []
            if (!memories.length) {
                container.innerHTML =
                    '<div class="empty-state">No memories yet. Use "+ Add" to create one.</div>'
                return
            }
            memories.sort(
                (a, b) =>
                    (b.metadata?.timestamp || 0) - (a.metadata?.timestamp || 0)
            )
            const list = document.createElement('div')
            list.className = 'memory-list'
            for (const mem of memories) {
                const item = document.createElement('div')
                item.className = 'memory-item'

                const type = document.createElement('div')
                type.className = 'memory-type'
                type.textContent = mem.metadata?.memory_type || 'fact'

                const text = document.createElement('div')
                text.className = 'memory-text'
                text.textContent = mem.content

                const del = document.createElement('button')
                del.className = 'memory-delete'
                del.textContent = '×'
                del.addEventListener('click', () => this.deleteMemory(mem.id))

                item.append(type, text, del)
                list.appendChild(item)
            }
            container.replaceChildren(list)
        } catch (e) {
            container.innerHTML =
                '<div class="empty-state">Failed to load memories</div>'
        }
    }

    async renderConversation() {
        const container = this.views.conversation
        if (!container) return
        container.innerHTML = '<div class="empty-state">Loading...</div>'
        try {
            const data = await (
                await fetch(`${this.apiUrl}/conversation/recent?limit=20&gap_minutes=30`)
            ).json()
            const messages = data.messages || data.conversation || []
            if (!messages.length) {
                container.innerHTML =
                    '<div class="empty-state">No conversation history.</div>'
                return
            }
            const list = document.createElement('div')
            list.className = 'memory-list'
            for (const m of messages) {
                if (m.user_message) {
                    list.appendChild(this.buildConvoRow('user', m.user_message))
                }
                if (m.assistant_response) {
                    list.appendChild(
                        this.buildConvoRow('assistant', m.assistant_response)
                    )
                }
            }
            container.replaceChildren(list)
        } catch (e) {
            container.innerHTML =
                '<div class="empty-state">No conversation history.</div>'
        }
    }

    buildConvoRow(role, text) {
        const item = document.createElement('div')
        item.className = 'memory-item'
        const label = document.createElement('div')
        label.className = 'memory-type'
        label.textContent = role
        const body = document.createElement('div')
        body.className = 'memory-text'
        body.textContent = text
        item.append(label, body)
        return item
    }

    async renderUserInfo() {
        const container = this.views.user
        if (!container) return
        container.innerHTML = '<div class="empty-state">Loading...</div>'
        try {
            const data = await (await fetch(`${this.apiUrl}/user/info`)).json()
            const userInfo = data.user_info || []
            const info = {}
            for (const mem of userInfo) {
                const match = mem.content.match(/^(.+?):\s*(.+)$/)
                if (match) info[match[1]] = match[2]
            }

            const form = document.createElement('div')
            form.className = 'user-info-form'
            for (const field of USER_FIELDS) {
                const row = document.createElement('div')
                row.className = 'user-info-row'

                const label = document.createElement('label')
                label.textContent =
                    field.charAt(0).toUpperCase() + field.slice(1)
                // mark required fields so it is clear what must be filled
                if (REQUIRED_USER_FIELDS.includes(field)) {
                    const star = document.createElement('span')
                    star.className = 'required-marker'
                    star.textContent = ' *'
                    label.appendChild(star)
                }

                const input = this.buildUserField(field, info[field] || '')
                row.append(label, input)
                form.appendChild(row)
            }
            const save = document.createElement('button')
            save.id = 'save-user-info-btn'
            save.textContent = 'Save'
            save.addEventListener('click', () => this.saveUserInfo())
            form.appendChild(save)

            container.replaceChildren(form)
        } catch (e) {
            container.innerHTML =
                '<div class="empty-state">Failed to load user info</div>'
        }
    }

    buildUserField(field, value) {
        if (field === 'timezone') {
            const select = document.createElement('select')
            select.id = `user-${field}`
            const blank = document.createElement('option')
            blank.value = ''
            blank.textContent = 'Select timezone...'
            select.appendChild(blank)
            for (const zone of timezoneOptions()) {
                const opt = document.createElement('option')
                opt.value = zone
                opt.textContent = zone
                select.appendChild(opt)
            }
            select.value = value
            return select
        }

        const input = document.createElement('input')
        input.type = 'text'
        input.id = `user-${field}`
        input.value = value
        input.placeholder = `Enter ${field}...`
        return input
    }

    async deleteMemory(memoryId) {
        if (!confirm('Delete this memory?')) return
        try {
            await fetch(`${this.apiUrl}/memory/${memoryId}`, {
                method: 'DELETE',
            })
            this.renderMemoriesList()
            this.updateStatsDisplay()
        } catch (e) {
            this.onMessage?.('Failed to delete memory', 'error')
        }
    }

    async submitNewMemory() {
        const content = document
            .getElementById('add-memory-content')
            .value.trim()
        const type = document.getElementById('add-memory-type').value
        if (!content) return
        try {
            await fetch(`${this.apiUrl}/remember`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content,
                    memory_type: type,
                    importance: 0.5,
                    source: 'user',
                }),
            })
            document.getElementById('add-memory-content').value = ''
            this.switchSubTab('list')
            this.updateStatsDisplay()
            this.onMessage?.('Memory added', 'event')
        } catch (e) {
            this.onMessage?.('Failed to add memory', 'error')
        }
    }

    async saveUserInfo() {
        for (const field of REQUIRED_USER_FIELDS) {
            const input = document.getElementById(`user-${field}`)
            if (!input || !input.value.trim()) {
                this.onMessage?.(`${field} is required`, 'error')
                input?.focus()
                return
            }
        }
        for (const field of USER_FIELDS) {
            const input = document.getElementById(`user-${field}`)
            if (input && input.value.trim()) {
                try {
                    await fetch(`${this.apiUrl}/user/info`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            key: field,
                            value: input.value.trim(),
                        }),
                    })
                } catch (e) {}
            }
        }
        this.updateStatsDisplay()
        this.onMessage?.('User info saved', 'event')
    }
}
