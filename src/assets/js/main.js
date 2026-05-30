import { PanelUI, StatusUI, IntegrationsUI } from './ui.js'
import { MemoryUI } from './memory.js'
import { Connect } from './connect.js'
import { CONFIG } from './config.js'

const API = (path) => `${CONFIG.apiUrl}${path}`

const panel = new PanelUI()
const status = new StatusUI()
const integrations = new IntegrationsUI()
const memory = new MemoryUI()

// finds the buttons inside a control group by its visible label
function getControlGroupButtons(label) {
    const groups = document.querySelectorAll('.control-group')
    for (const group of groups) {
        const groupLabel = group.querySelector('.control-group-label')
        if (groupLabel && groupLabel.textContent.trim() === label) {
            return group.querySelectorAll('.control-buttons button')
        }
    }
    return []
}

// action handlers, wired to the backend later
function sendChatMessage() {
    const input = document.getElementById('chat-input')
    const text = input.value.trim()
    if (!text) return
    input.value = ''
}

function toggleMicrophoneRecording() {
    const btn = document.getElementById('microphone-chat-button')
    status.updateMicButton(!btn.classList.contains('active'))
}

function setAvatarExpression(expression) {
    status.updateExpression(expression)
}

function setAvatarState(state) {
    status.updateState(state)
}

function setProfanityFilterEnabled(enabled) {
    status.setProfanityFilter(enabled)
}

function clearChatMessages() {}

function clearMemoryAndHistory() {}

function toggleDiscordVoiceChannel() {
    integrations.toggleDiscordButton()
}

function sendTestDonation() {}

function refreshSoundEffects() {}

function playSoundEffect() {
    const name = document.getElementById('sound-test-name').value.trim()
    if (!name) return
}

function clearLogMessages() {}

function toggleDebugLogging() {}

function wirePanelTabs() {
    document.querySelectorAll('.panel-tab').forEach((tab) => {
        tab.addEventListener('click', () =>
            panel.switchTab(tab.id.replace('panel-', ''))
        )
    })
}

function wireMemorySubTabs() {
    document.querySelectorAll('.memory-sub-tab').forEach((tab) => {
        tab.addEventListener('click', () =>
            memory.switchSubTab(tab.id.replace('mem-tab-', ''))
        )
    })
}

function wireChatControls() {
    document
        .getElementById('microphone-chat-button')
        .addEventListener('click', toggleMicrophoneRecording)
    document
        .getElementById('send-chat-button')
        .addEventListener('click', sendChatMessage)
    document.getElementById('chat-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendChatMessage()
    })
    status.initMicButtonHover()
}

function wireControlButtons() {
    getControlGroupButtons('Expression').forEach((btn) => {
        btn.addEventListener('click', () =>
            setAvatarExpression(btn.textContent.trim().toLowerCase())
        )
    })
    getControlGroupButtons('State').forEach((btn) => {
        btn.addEventListener('click', () =>
            setAvatarState(btn.textContent.trim().toLowerCase())
        )
    })

    document
        .getElementById('mode-filtered')
        .addEventListener('click', () => setProfanityFilterEnabled(true))
    document
        .getElementById('mode-unfiltered')
        .addEventListener('click', () => setProfanityFilterEnabled(false))

    const actions = getControlGroupButtons('Actions')
    if (actions[0]) actions[0].addEventListener('click', clearChatMessages)
}

function wireIntegrationControls() {
    document
        .getElementById('discord-vc-btn')
        .addEventListener('click', toggleDiscordVoiceChannel)

    const donate = document.querySelector('.donation-test-button')
    if (donate) donate.addEventListener('click', sendTestDonation)

    const sounds = getControlGroupButtons('Sound Effects')
    if (sounds[0]) sounds[0].addEventListener('click', refreshSoundEffects)
    if (sounds[1]) sounds[1].addEventListener('click', playSoundEffect)
}

function wireLogControls() {
    const logButtons = document.querySelectorAll('.log-controls-bar button')
    if (logButtons[0])
        logButtons[0].addEventListener('click', toggleDebugLogging)
    if (logButtons[1]) logButtons[1].addEventListener('click', clearLogMessages)
}

document.addEventListener('DOMContentLoaded', () => {
    wirePanelTabs()
    wireMemorySubTabs()
    wireChatControls()
    wireControlButtons()
    wireIntegrationControls()
    wireLogControls()

    status.setDefaults()
    integrations.setDefaults()
    memory.setDefaults()

    const connect = new Connect()
    connect.addEventListener('status-change', (e) => {
        status.updateConnection(e.detail.status, e.detail.isError)
    })
    connect.connect()
})
