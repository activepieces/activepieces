import { describe, expect, it } from 'vitest'
import { agentActionHelpers } from '../../../../src/app/ee/agent/tools/agent-tools'

describe('shaping an ap_explore_data result', () => {
    it('keeps only the asked fields, also inside a nested properties object', () => {
        const output = [{ id: 1, name: 'a', junk: 'x', properties: { email: 'a@x', other: 1 } }]

        expect(agentActionHelpers.shapeExploreOutput({ output, fields: ['id', 'email'] })).toEqual([{ id: 1, properties: { email: 'a@x' } }])
    })

    it('cuts a long list to the default size and says how many there were', () => {
        const output = { rows: Array.from({ length: 50 }, (_, i) => ({ i })), cursor: 'next' }

        const shaped = agentActionHelpers.shapeExploreOutput({ output })

        expect(shaped).toMatchObject({ cursor: 'next', rows: { shown: 20, total: 50 } })
    })

    it('returns a short list unchanged when no fields are asked', () => {
        const output = [{ a: 1 }, { a: 2 }]

        expect(agentActionHelpers.shapeExploreOutput({ output, limit: 5 })).toEqual(output)
    })

    it('selects fields of a single record', () => {
        expect(agentActionHelpers.shapeExploreOutput({ output: { id: 1, body: 'long' }, fields: ['id'] })).toEqual({ id: 1 })
    })
})

describe('an action called with no connection picked', () => {
    const piece = { name: '@activepieces/piece-slack', displayName: 'Slack', auth: { type: 'OAUTH2' }, actions: { send: { requireAuth: true }, ping: { requireAuth: false } } }

    it('tells the model to show the picker for a piece that needs auth', () => {
        expect(agentActionHelpers.connectionPickRequiredText({ piece, actionName: 'send' })).toContain('ap_show_connection_picker with piece "slack"')
    })

    it('says nothing for an action that runs without auth', () => {
        expect(agentActionHelpers.connectionPickRequiredText({ piece, actionName: 'ping' })).toBeNull()
        expect(agentActionHelpers.connectionPickRequiredText({ piece: { ...piece, auth: undefined }, actionName: 'send' })).toBeNull()
        expect(agentActionHelpers.connectionPickRequiredText({ piece: undefined, actionName: 'send' })).toBeNull()
    })
})
