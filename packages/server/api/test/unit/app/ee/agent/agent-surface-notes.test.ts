import { AgentRunSource } from '@activepieces/shared'
import { describe, expect, it } from 'vitest'
import { agentSurfaceNotes } from '../../../../../src/app/ee/agent/prompt/agent-surface-notes'

// agentToolPolicy grants these to a chat run only, so a note naming one anywhere else points the
// model at a tool it does not have.
const CHAT_ONLY_TOOLS = [
    'ap_remember',
    'ap_list_connections',
    'ap_send_email',
    'ap_show_connection_required',
    'ap_show_mcp_reconnect',
    'ap_discover_action_auth',
]

const EVERYTHING_AVAILABLE = { searchAvailable: true, fetchAvailable: true, scrapeAvailable: true, imageAvailable: true, emailAvailable: true }

function notesFor(source: AgentRunSource): string {
    return agentSurfaceNotes.buildRunNotes({
        source,
        currentDate: 'Tuesday, August 18, 2026',
        ...EVERYTHING_AVAILABLE,
        userEmail: 'owner@acme.com',
        connections: { connections: [{ displayName: 'Gmail', pieceName: '@activepieces/piece-gmail', status: 'ACTIVE' }], truncated: true },
        memory: { instructions: 'Answer in Arabic', memories: ['Prefers TypeScript'] },
    })
}

describe('what each surface is told it can do', () => {
    it('tells a chat run about everything it has', () => {
        const notes = notesFor(AgentRunSource.CHAT)

        for (const tool of CHAT_ONLY_TOOLS) {
            expect(notes).toContain(tool)
        }
        expect(notes).toContain('ap_generate_image')
        expect(notes).toContain('Prefers TypeScript')
        expect(notes).toContain('Gmail')
    })

    it('never names a chat-only tool to a saved agent', () => {
        const notes = notesFor(AgentRunSource.AGENT)

        for (const tool of CHAT_ONLY_TOOLS) {
            expect(notes).not.toContain(tool)
        }
    })

    it('never names a chat-only tool to an unattended flow step', () => {
        const notes = notesFor(AgentRunSource.FLOW_STEP)

        for (const tool of CHAT_ONLY_TOOLS) {
            expect(notes).not.toContain(tool)
        }
    })

    it('keeps one person\'s remembered preferences out of an agent everyone shares', () => {
        const notes = notesFor(AgentRunSource.AGENT)

        expect(notes).not.toContain('Answer in Arabic')
        expect(notes).not.toContain('Prefers TypeScript')
    })

    it('leaves the connection inventory out of a configured surface', () => {
        expect(notesFor(AgentRunSource.AGENT)).not.toContain('Your connected apps')
        expect(notesFor(AgentRunSource.FLOW_STEP)).not.toContain('Your connected apps')
    })

    it('offers image generation only where someone is there to see the image', () => {
        expect(notesFor(AgentRunSource.AGENT)).toContain('ap_generate_image')
        expect(notesFor(AgentRunSource.FLOW_STEP)).not.toContain('ap_generate_image')
    })

    it('still says what is unavailable, so the model does not claim it searched', () => {
        const notes = agentSurfaceNotes.buildRunNotes({
            source: AgentRunSource.CHAT,
            currentDate: 'Tuesday, August 18, 2026',
            searchAvailable: false, fetchAvailable: false, scrapeAvailable: false, imageAvailable: false, emailAvailable: false,
            userEmail: 'owner@acme.com',
            connections: null,
            memory: { instructions: null, memories: [] },
        })

        expect(notes).toContain('NOT available')
        expect(notes).not.toContain('ap_web_search')
        expect(notes).not.toContain('ap_send_email')
    })
})
