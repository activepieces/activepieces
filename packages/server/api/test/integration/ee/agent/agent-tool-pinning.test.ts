import { AgentToolType } from '@activepieces/core-piece-types'
import { describe, expect, it } from 'vitest'
import { agentToolPinning } from '../../../../src/app/ee/agent/agent-tool-pinning'

const pieceTool = ({ pieceName, actionName, auth }: { pieceName: string, actionName: string, auth?: string }) => ({
    type: AgentToolType.PIECE as const,
    toolName: `${pieceName}-${actionName}`,
    pieceMetadata: {
        pieceName,
        pieceVersion: '1.0.0',
        actionName,
        ...(auth === undefined ? {} : { predefinedInput: { auth, fields: {} } }),
    },
})

const gmail = (auth?: string) => pieceTool({ pieceName: '@activepieces/piece-gmail', actionName: 'gmail_search_mail', ...(auth === undefined ? {} : { auth }) })

describe('agentToolPinning.pinConnection', () => {
    it('pins an account onto a tool that had none, which is the whole loop this closes', () => {
        const pinned = agentToolPinning.pinConnection({ tools: [gmail()], pieceName: '@activepieces/piece-gmail', externalId: 'conn_1' })

        expect(pinned?.[0]).toMatchObject({ pieceMetadata: { predefinedInput: { auth: 'conn_1' } } })
    })

    it('replaces an account that no longer works, so a repair sticks', () => {
        const pinned = agentToolPinning.pinConnection({ tools: [gmail('conn_dead')], pieceName: '@activepieces/piece-gmail', externalId: 'conn_new' })

        expect(pinned?.[0]).toMatchObject({ pieceMetadata: { predefinedInput: { auth: 'conn_new' } } })
    })

    it('reports no change when the tool already uses that account, so no needless write happens', () => {
        expect(agentToolPinning.pinConnection({ tools: [gmail('conn_1')], pieceName: '@activepieces/piece-gmail', externalId: 'conn_1' })).toBeNull()
    })

    it('recognises the older template form, so a legacy pin is not treated as a different account', () => {
        expect(agentToolPinning.pinConnection({ tools: [gmail("{{connections['conn_1']}}")], pieceName: '@activepieces/piece-gmail', externalId: 'conn_1' })).toBeNull()
    })

    it('replaces a legacy template pin when the account really did change', () => {
        const pinned = agentToolPinning.pinConnection({ tools: [gmail("{{connections['conn_old']}}")], pieceName: '@activepieces/piece-gmail', externalId: 'conn_new' })

        expect(pinned?.[0]).toMatchObject({ pieceMetadata: { predefinedInput: { auth: 'conn_new' } } })
    })

    it('leaves other apps alone, so repairing Gmail cannot touch Slack', () => {
        const slack = pieceTool({ pieceName: '@activepieces/piece-slack', actionName: 'send_channel_message', auth: 'conn_slack' })

        const pinned = agentToolPinning.pinConnection({ tools: [gmail(), slack], pieceName: '@activepieces/piece-gmail', externalId: 'conn_1' })

        expect(pinned?.[1]).toStrictEqual(slack)
    })

    it('pins every action of the same app, since they share one account', () => {
        const read = gmail()
        const send = pieceTool({ pieceName: '@activepieces/piece-gmail', actionName: 'send_email' })

        const pinned = agentToolPinning.pinConnection({ tools: [read, send], pieceName: '@activepieces/piece-gmail', externalId: 'conn_1' })

        expect(pinned?.map((tool) => tool.type === AgentToolType.PIECE ? tool.pieceMetadata.predefinedInput?.auth : null)).toStrictEqual(['conn_1', 'conn_1'])
    })

    it('matches on the normalized piece name, so a short name still finds the tool', () => {
        const pinned = agentToolPinning.pinConnection({ tools: [gmail()], pieceName: 'gmail', externalId: 'conn_1' })

        expect(pinned?.[0]).toMatchObject({ pieceMetadata: { predefinedInput: { auth: 'conn_1' } } })
    })

    it('reports no change when the agent has no tool for that app at all', () => {
        const slack = pieceTool({ pieceName: '@activepieces/piece-slack', actionName: 'send_channel_message' })

        expect(agentToolPinning.pinConnection({ tools: [slack], pieceName: '@activepieces/piece-gmail', externalId: 'conn_1' })).toBeNull()
    })

    it('reports no change for an agent with no tools', () => {
        expect(agentToolPinning.pinConnection({ tools: [], pieceName: '@activepieces/piece-gmail', externalId: 'conn_1' })).toBeNull()
    })

    it('keeps other predefined fields, so pinning does not wipe a configured input', () => {
        const withFields = {
            ...gmail(),
            pieceMetadata: { ...gmail().pieceMetadata, predefinedInput: { fields: { label: 'INBOX' } } },
        }

        const pinned = agentToolPinning.pinConnection({ tools: [withFields], pieceName: '@activepieces/piece-gmail', externalId: 'conn_1' })

        expect(pinned?.[0]).toMatchObject({ pieceMetadata: { predefinedInput: { auth: 'conn_1', fields: { label: 'INBOX' } } } })
    })

    it('does not mutate the tools it was given, so a failed save cannot leave a half-edited draft', () => {
        const tools = [gmail()]
        const snapshot = JSON.stringify(tools)

        agentToolPinning.pinConnection({ tools, pieceName: '@activepieces/piece-gmail', externalId: 'conn_1' })

        expect(JSON.stringify(tools)).toBe(snapshot)
    })
})
