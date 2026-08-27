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

const IDENTITY = {
    firstName: 'Dana',
    lastName: 'Okwu',
    email: 'dana@acme.com',
    platformName: 'Acme Automate',
    identity: {
        company: { name: 'Acme', description: 'a logistics company', industry: 'Transport' },
        role: 'Operations Lead',
    },
}

const EVERYTHING_AVAILABLE = { searchAvailable: true, fetchAvailable: true, scrapeAvailable: true, imageAvailable: true, emailAvailable: true, agentsAvailable: true }

function notesFor(source: AgentRunSource): string {
    return agentSurfaceNotes.buildRunNotes({
        source,
        currentDate: 'Tuesday, August 18, 2026',
        ...EVERYTHING_AVAILABLE,
        userEmail: 'owner@acme.com',
        userIdentity: IDENTITY,
        connections: { connections: [{ displayName: 'Gmail', pieceName: '@activepieces/piece-gmail', status: 'ACTIVE' }], truncated: true },
        memory: { instructions: 'Answer in Arabic', memories: ['Prefers TypeScript'] },
    })
}

describe('what each surface is told it can do', () => {
    it('tells an agent run to offer the connection card, and tells nobody else', () => {
        expect(notesFor(AgentRunSource.AGENT)).toContain('ap_show_connection_picker')
        expect(notesFor(AgentRunSource.CHAT)).not.toContain('cannot sign in')
        expect(notesFor(AgentRunSource.FLOW_STEP)).not.toContain('cannot sign in')
        expect(notesFor(AgentRunSource.AGENT_BUILDER)).not.toContain('cannot sign in')
    })

    it('never tells the builder it can read the web, because its tool set has no web in it', () => {
        const notes = notesFor(AgentRunSource.AGENT_BUILDER)

        expect(notes).not.toContain('ap_web_search')
        expect(notes).not.toContain('ap_fetch_url')
        expect(notes).not.toContain('ap_scrape_url')
        expect(notes).not.toContain('ap_generate_image')
    })

    it('only tells a chat run about saved agents, and only where the surface exists', () => {
        expect(notesFor(AgentRunSource.CHAT)).toContain('Saved agents')
        expect(notesFor(AgentRunSource.FLOW_STEP)).not.toContain('Saved agents')
        expect(notesFor(AgentRunSource.AGENT)).not.toContain('Saved agents')
    })

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
            searchAvailable: false, fetchAvailable: false, scrapeAvailable: false, imageAvailable: false, emailAvailable: false, agentsAvailable: false,
            userEmail: 'owner@acme.com',
            userIdentity: null,
            connections: null,
            memory: { instructions: null, memories: [] },
        })

        expect(notes).toContain('NOT available')
        expect(notes).not.toContain('Saved agents')
        expect(notes).not.toContain('ap_web_search')
        expect(notes).not.toContain('ap_send_email')
    })
})

describe('who the agent is told it is talking to', () => {
    function identityNoteFor({ source, userIdentity }: { source: AgentRunSource, userIdentity: typeof IDENTITY | null }): string {
        return agentSurfaceNotes.buildRunNotes({
            source,
            currentDate: 'Tuesday, August 18, 2026',
            ...EVERYTHING_AVAILABLE,
            userEmail: userIdentity?.email ?? 'owner@acme.com',
            userIdentity,
            connections: null,
            memory: { instructions: null, memories: [] },
        })
    }

    it('gives a chat run the researched company and the caller\'s own role', () => {
        const notes = identityNoteFor({ source: AgentRunSource.CHAT, userIdentity: IDENTITY })

        expect(notes).toContain('Who you\'re talking to')
        expect(notes).toContain('Dana Okwu')
        expect(notes).toContain('Acme')
        expect(notes).toContain('Operations Lead')
        expect(notes).toContain('Acme Automate')
    })

    it('falls back to the email domain when nothing has been researched', () => {
        const notes = identityNoteFor({ source: AgentRunSource.CHAT, userIdentity: { ...IDENTITY, identity: null } })

        expect(notes).toContain('dana@acme.com')
        expect(notes).toContain('the company is likely')
        expect(notes).not.toContain('a logistics company')
    })

    it('still names the role when only the company research is missing', () => {
        const notes = identityNoteFor({
            source: AgentRunSource.CHAT,
            userIdentity: { ...IDENTITY, identity: { company: null, role: 'Operations Lead' } },
        })

        expect(notes).toContain('Operations Lead')
        expect(notes).toContain('the company is likely')
    })

    it('guesses no company from a personal mailbox', () => {
        const notes = identityNoteFor({
            source: AgentRunSource.CHAT,
            userIdentity: { ...IDENTITY, email: 'dana@gmail.com', identity: null },
        })

        expect(notes).not.toContain('the company is likely')
    })

    it('leaves the person out of a surface with nobody in the room', () => {
        expect(identityNoteFor({ source: AgentRunSource.FLOW_STEP, userIdentity: IDENTITY })).not.toContain('Who you\'re talking to')
        expect(identityNoteFor({ source: AgentRunSource.AGENT, userIdentity: IDENTITY })).not.toContain('Who you\'re talking to')
    })

    it('puts the person above the first-message note that points back at them', () => {
        const notes = agentSurfaceNotes.buildRunNotes({
            source: AgentRunSource.CHAT,
            messageSource: 'onboarding',
            currentDate: 'Tuesday, August 18, 2026',
            ...EVERYTHING_AVAILABLE,
            userEmail: IDENTITY.email,
            userIdentity: IDENTITY,
            connections: null,
            memory: { instructions: null, memories: [] },
        })

        expect(notes.indexOf('Who you\'re talking to')).toBeLessThan(notes.indexOf('FIRST message ever'))
    })
})
