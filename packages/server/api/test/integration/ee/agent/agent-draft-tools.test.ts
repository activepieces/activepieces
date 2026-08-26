import { AgentToolType, mcpToolNameUtils } from '@activepieces/shared'
import { describe, expect, it } from 'vitest'
import { agentDraftTools } from '../../../../src/app/ee/agent/agent-draft-ai'

const NOTES = {
    pieceName: '@activepieces/piece-test-notes',
    pieceVersion: '0.4.2',
    connectionExternalId: 'conn-notes',
    actionNames: ['save_note', 'read_note'],
}

const MEMOS = {
    pieceName: '@activepieces/piece-test-memos',
    pieceVersion: '1.0.0',
    connectionExternalId: 'conn-memos',
    actionNames: ['save_note'],
}

describe('what the model is offered', () => {
    it('lists only the pieces the project has a connection for, with their actions', () => {
        const prompt = agentDraftTools.withCandidates({ prompt: 'watch competitor pricing', candidates: [NOTES] })

        expect(prompt).toContain('watch competitor pricing')
        expect(prompt).toContain('@activepieces/piece-test-notes (save_note, read_note)')
    })

    it('says so plainly when the project has no connections, rather than leaving it to guess', () => {
        const prompt = agentDraftTools.withCandidates({ prompt: 'watch competitor pricing', candidates: [] })

        expect(prompt).toContain('none')
        expect(prompt).toContain('empty tools list')
    })
})

describe('what a pick is allowed to become', () => {
    it('pins the version and the connection the server resolved, not anything the model said', () => {
        const tools = agentDraftTools.resolveToolPicks({
            picks: [{ pieceName: NOTES.pieceName, actionName: 'save_note' }],
            candidates: [NOTES],
        })

        expect(tools).toHaveLength(1)
        expect(tools[0].type).toBe(AgentToolType.PIECE)
        expect(tools[0].toolName).toBe(mcpToolNameUtils.createPieceToolName(NOTES.pieceName, 'save_note'))
        expect(tools[0]).toMatchObject({
            pieceMetadata: {
                pieceName: NOTES.pieceName,
                pieceVersion: NOTES.pieceVersion,
                actionName: 'save_note',
                predefinedInput: { auth: NOTES.connectionExternalId },
            },
        })
    })

    it('drops a piece the project never connected', () => {
        const tools = agentDraftTools.resolveToolPicks({
            picks: [{ pieceName: '@activepieces/piece-slack', actionName: 'send_channel_message' }],
            candidates: [NOTES],
        })

        expect(tools).toEqual([])
    })

    it('drops an action the connected piece does not have', () => {
        const tools = agentDraftTools.resolveToolPicks({
            picks: [{ pieceName: NOTES.pieceName, actionName: 'delete_everything' }],
            candidates: [NOTES],
        })

        expect(tools).toEqual([])
    })

    it('keeps the real picks out of a reply that mixes them with invented ones', () => {
        const tools = agentDraftTools.resolveToolPicks({
            picks: [
                { pieceName: '@activepieces/piece-slack', actionName: 'send_channel_message' },
                { pieceName: NOTES.pieceName, actionName: 'read_note' },
            ],
            candidates: [NOTES],
        })

        expect(tools.map((tool) => tool.pieceMetadata?.actionName)).toEqual(['read_note'])
    })

    it('gives two pieces that name their action the same their own tool names', () => {
        const tools = agentDraftTools.resolveToolPicks({
            picks: [
                { pieceName: NOTES.pieceName, actionName: 'save_note' },
                { pieceName: MEMOS.pieceName, actionName: 'save_note' },
            ],
            candidates: [NOTES, MEMOS],
        })

        expect(tools).toHaveLength(2)
        expect(new Set(tools.map((tool) => tool.toolName)).size).toBe(2)
    })

    it('asks for the same action twice and gets it once', () => {
        const tools = agentDraftTools.resolveToolPicks({
            picks: [
                { pieceName: NOTES.pieceName, actionName: 'save_note' },
                { pieceName: NOTES.pieceName, actionName: 'save_note' },
            ],
            candidates: [NOTES],
        })

        expect(tools).toHaveLength(1)
    })

    it('stops at four however many the model returns', () => {
        const wide = { ...NOTES, actionNames: ['a', 'b', 'c', 'd', 'e', 'f'] }
        const tools = agentDraftTools.resolveToolPicks({
            picks: wide.actionNames.map((actionName) => ({ pieceName: wide.pieceName, actionName })),
            candidates: [wide],
        })

        expect(tools).toHaveLength(4)
    })
})
