import { PanelUI, StatusUI, IntegrationsUI, ChatUI, LogUI } from './ui.js'
import { MemoryUI } from './memory.js'
import { Connect, ContinuousListener } from './connect.js'
import { CONFIG } from './config.js'

const API = (path) => `${CONFIG.apiUrl}${path}`

const panel = new PanelUI()
const status = new StatusUI()
const integrations = new IntegrationsUI()
const chat = new ChatUI()
const logs = new LogUI()
const memory = new MemoryUI()
const connection = new Connect()
const continuousListener = new ContinuousListener()

let currentState = { expression: 'neutral', state: 'idle', isSpeaking: false }

function fmtMs(ms) {
    if (ms == null) return '-'
    if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`
    return `${Math.round(ms)}ms`
}

const ERROR_LABELS = {
    tts_auth: 'Voice auth failed. Check the TTS API key.',
    tts_unavailable: 'Voice service is unavailable.',
    llm_error: 'Language model request failed.',
    llm_rate_limited: 'Rate limited. Wait a minute or switch to Ollama.',
    stt_error: 'Could not transcribe audio.',
    memory_error: 'Memory service failed.',
}

function errText(data) {
    if (!data) return 'Unknown error'
    return ERROR_LABELS[data.code] || data.message || 'Unknown error'
}

function isError(res, data) {
    return !res.ok || !!(data && data.code)
}

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

function handleMessage(msg) {
    logs.log(`< ${msg.type}: ${JSON.stringify(msg.data ?? {})}`, 'debug')
    switch (msg.type) {
        case 'state_update':
            handleStateUpdate(msg.data)
            break
        case 'expression':
            currentState.expression = msg.data.expression
            status.updateExpression(msg.data.expression)
            break
        case 'state':
            currentState.state = msg.data.state
            status.updateState(msg.data.state)
            break
        case 'speak_start':
            currentState.isSpeaking = true
            status.updateSpeech(true)
            break
        case 'speak_stop':
            currentState.isSpeaking = false
            status.updateSpeech(false)
            break
        case 'content_mode':
            updateContentModeUI(msg.data.content_mode)
            break
        case 'transcription':
            handleTranscription(msg.data)
            break
        case 'chat_message':
            handleChatMessage(msg.data)
            break
        case 'external_message':
            handleExternalMessage(msg.data)
            break
        case 'wake_command':
            logs.log(`Wake command: ${msg.data.command}`, 'event')
            break
        case 'error':
            chat.removeProcessingMessage()
            chat.addMessage(errText(msg.data), 'system')
            logs.log(`Error [${msg.data?.code}]: ${errText(msg.data)}`, 'error')
            break
    }
}

function handleStateUpdate(data) {
    currentState.expression = data.expression || 'neutral'
    currentState.state = data.state || 'idle'
    currentState.isSpeaking = !!data.is_speaking
    status.updateExpression(currentState.expression)
    status.updateState(currentState.state)
    status.updateSpeech(currentState.isSpeaking)
    if (data.content_mode) updateContentModeUI(data.content_mode)
}

function handleTranscription(data) {
    if (!data.text?.trim()) return
    if (data.final) chat.removeInterimTranscription()
    else chat.showInterimTranscription(data.text)
}

function handleChatMessage(data) {
    chat.removeInterimTranscription()
    chat.removeProcessingMessage()
    if (data.response?.trim()) chat.addMessage(data.response, 'assistant')
}

function handleExternalMessage(data) {
    if (data.message?.trim()) {
        chat.addMessage(data.message, 'user', {
            source: data.source || 'external',
            username: data.username || 'anonymous',
            color: data.metadata?.color || '',
        })
    }
}

async function sendChatMessage() {
    const message = chat.getInputValue()
    if (!message) return
    chat.addMessage(message, 'user')
    chat.setInputDisabled(true)
    chat.addMessage('Thinking...', 'system')
    try {
        const res = await fetch(API('/chat'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message }),
        })
        const data = await res.json()
        chat.removeProcessingMessage()
        if (isError(res, data)) {
            chat.addMessage(errText(data), 'system')
            logs.log(`Chat error [${data.code}]: ${errText(data)}`, 'error')
            return
        }
        chat.addMessage(data.response, 'assistant')
        memory.updateStatsDisplay()
        updatePerformanceStats()
    } catch (e) {
        chat.removeProcessingMessage()
        chat.addMessage(`Error: ${e.message}`, 'system')
        logs.log(`Chat error: ${e.message}`, 'error')
    } finally {
        chat.setInputDisabled(false)
        chat.focusInput()
    }
}

async function sendStreamingVoice(blob) {
    logs.log(`Sending voice clip (${blob.size} bytes)`, 'debug')
    try {
        const formData = new FormData()
        formData.append('audio', blob, 'recording.webm')
        const res = await fetch(API('/chat/voice/stream'), {
            method: 'POST',
            body: formData,
        })
        const data = await res.json()
        logs.log(`Voice stream: ${JSON.stringify(data)}`, 'debug')
        if (isError(res, data)) {
            chat.addMessage(errText(data), 'system')
        } else if (data.queued) {
            chat.addMessage(`[queued] ${data.transcribed}`, 'user')
        } else if (data.transcribed?.trim()) {
            chat.addMessage(data.transcribed, 'user')
        }
    } catch (e) {
        chat.addMessage(`Error: ${e.message}`, 'system')
        logs.log(`Voice error: ${e.message}`, 'error')
    }
}

async function toggleMicrophoneListening() {
    if (continuousListener.isListening) {
        continuousListener.stop()
        status.updateMicButton(false)
        connection.sendAction('set_state', { state: 'idle' })
        logs.log('Stopped listening', 'event')
        return
    }
    logs.log('Requesting microphone...', 'debug')
    if (await continuousListener.start()) {
        status.updateMicButton(true)
        logs.log('Listening - just talk', 'event')
    }
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

    memory.onMessage = (text, level) => logs.log(text, level)

    connection.addEventListener('status-change', (e) => {
        status.updateConnection(e.detail.status, e.detail.isError)
        logs.log(
            `Connection: ${e.detail.status}`,
            e.detail.isError ? 'warn' : 'event'
        )
    })
    connection.addEventListener('message', (e) => handleMessage(e.detail))
    connection.connect()
})

window.addEventListener('beforeunload', () => {
    if (continuousListener.isListening) continuousListener.stop()
})
