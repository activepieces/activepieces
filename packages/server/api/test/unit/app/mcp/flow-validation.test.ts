import { FlowActionType, FlowTrigger, FlowTriggerType } from '@activepieces/shared'
import { describe, expect, it } from 'vitest'
import { flowValidation } from '../../../../src/app/mcp/tools/flow-validation'

describe('flowValidation.validateFlow — formulas', () => {
    it('does not read a formula function as a missing step', () => {
        const result = flowValidation.validateFlow({ trigger: flowWithInput({ text: 'ap-formula-v1::{count({{trigger[\'output\'].rows}})}::ap-formula-v1' }) })

        expect(result.issues).toEqual([])
    })

    it('names a formula function written inside {{ }} and shows the right syntax', () => {
        const result = flowValidation.validateFlow({ trigger: flowWithInput({ text: 'Total: {{length(trigger[\'output\'].rows)}}' }) })

        expect(result.issues).toHaveLength(1)
        expect(result.issues[0].message).toContain('length()')
        expect(result.issues[0].message).toContain('ap-formula-v1::{length(')
    })

    it('accepts a JavaScript helper the engine runs inside {{ }}', () => {
        const result = flowValidation.validateFlow({ trigger: flowWithInput({ text: "{{ flattenNestedKeys(trigger['output'], ['users', 'name']) }}" }) })

        expect(result.issues).toEqual([])
    })

    it('names a camelCase formula function written inside {{ }}', () => {
        const result = flowValidation.validateFlow({ trigger: flowWithInput({ text: '{{formatDate(now(); "YYYY")}}' }) })

        expect(result.issues.map((issue) => issue.message)).toEqual([expect.stringContaining('formatDate()')])
    })

    it('still flags a reference to a step that does not exist', () => {
        const result = flowValidation.validateFlow({ trigger: flowWithInput({ text: '{{step_9[\'output\'].id}}' }) })

        expect(result.issues.map((issue) => issue.message)).toEqual([expect.stringContaining('does not exist')])
    })
})

describe('flowValidation.validateFlow — project scoped references', () => {
    it('accepts a project variable reference copied from the Variables page', () => {
        const result = flowValidation.validateFlow({ trigger: flowWithInput({ body: { token: '{{variables[\'ATOMIC_CLAIM_API_TOKEN\']}}' } }) })

        expect(result.issues).toEqual([])
        expect(flowValidation.hasNoBlockingIssues(result.issues)).toBe(true)
    })

    it('accepts a connection reference', () => {
        const result = flowValidation.validateFlow({ trigger: flowWithInput({ auth: '{{connections[\'my-conn\']}}' }) })

        expect(result.issues).toEqual([])
    })

    it('still flags a missing step used next to a project variable', () => {
        const result = flowValidation.validateFlow({ trigger: flowWithInput({ text: '{{variables[\'API_TOKEN\']}} {{step_9[\'output\'].id}}' }) })

        expect(result.issues.map((issue) => issue.message)).toEqual([expect.stringContaining('"{{step_9...}}" which does not exist')])
    })
})

function flowWithInput(input: Record<string, unknown>): FlowTrigger {
    return {
        name: 'trigger',
        valid: true,
        displayName: 'Catch Webhook',
        lastUpdatedDate: '2024-01-01T00:00:00Z',
        type: FlowTriggerType.PIECE,
        settings: { pieceName: '@activepieces/piece-webhook', pieceVersion: '~0.1.0', triggerName: 'catch_webhook', input: {}, propertySettings: {} },
        nextAction: {
            name: 'step_1',
            valid: true,
            displayName: 'Send Email',
            lastUpdatedDate: '2024-01-01T00:00:00Z',
            type: FlowActionType.PIECE,
            settings: { pieceName: '@activepieces/piece-gmail', pieceVersion: '~0.1.0', actionName: 'send_email', input, propertySettings: {} },
        },
    }
}
