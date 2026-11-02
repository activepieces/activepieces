import { FlowActionType, FlowTrigger, FlowTriggerType } from '@activepieces/core-execution'
import { flowStepDiff } from '../../src/lib/ee/agent/flow-step-diff'

function slackStep({ name, channel, next }: { name: string, channel: string, next?: Record<string, unknown> }): Record<string, unknown> {
    return {
        name,
        displayName: 'Send message',
        type: FlowActionType.PIECE,
        valid: true,
        lastUpdatedDate: '2026-10-14T00:00:00.000Z',
        settings: { pieceName: '@activepieces/piece-slack', pieceVersion: '0.1.0', actionName: 'send_message', input: { channel, text: 'hi' }, sampleData: {} },
        ...(next ? { nextAction: next } : {}),
    }
}

function buildTrigger(nextAction?: Record<string, unknown>): FlowTrigger {
    return FlowTrigger.parse({
        name: 'trigger',
        displayName: 'Schedule',
        type: FlowTriggerType.EMPTY,
        valid: true,
        lastUpdatedDate: '2026-10-14T00:00:00.000Z',
        settings: {},
        ...(nextAction ? { nextAction } : {}),
    })
}

function snapshot(trigger: FlowTrigger) {
    return flowStepDiff.takeSnapshot({ trigger, versionId: 'v1' })
}

describe('flowStepDiff', () => {
    it('reports nothing when the flow is unchanged', () => {
        const trigger = buildTrigger(slackStep({ name: 'step_1', channel: '#general' }))
        expect(flowStepDiff.diff({ before: snapshot(trigger), after: snapshot(trigger) })).toEqual([])
    })

    it('ignores sample data and key order', () => {
        const before = buildTrigger(slackStep({ name: 'step_1', channel: '#general' }))
        const step = slackStep({ name: 'step_1', channel: '#general' })
        const after = buildTrigger({ ...step, settings: { input: { text: 'hi', channel: '#general' }, actionName: 'send_message', pieceVersion: '0.1.0', pieceName: '@activepieces/piece-slack', sampleData: { lastTestDate: 'now' } } })
        expect(flowStepDiff.diff({ before: snapshot(before), after: snapshot(after) })).toEqual([])
    })

    it('reports a changed input with before and after values', () => {
        const before = snapshot(buildTrigger(slackStep({ name: 'step_1', channel: '#general' })))
        const after = snapshot(buildTrigger(slackStep({ name: 'step_1', channel: '#sales' })))
        const changes = flowStepDiff.diff({ before, after })
        expect(changes).toEqual([{ stepName: 'step_1', displayName: 'Send message', kind: 'changed', fields: [{ path: 'input.channel', before: '#general', after: '#sales' }] }])
        expect(flowStepDiff.describe({ changes, flowId: 'f1' })).toContain('step_1 (Send message): input.channel "#general" → "#sales"')
    })

    it('reports added and removed steps', () => {
        const before = snapshot(buildTrigger(slackStep({ name: 'step_1', channel: '#a' })))
        const after = snapshot(buildTrigger(slackStep({ name: 'step_2', channel: '#a' })))
        const kinds = flowStepDiff.diff({ before, after }).map((change) => `${change.kind}:${change.stepName}`)
        expect(kinds).toEqual(['removed:step_1', 'added:step_2'])
    })

    it('reports a reordered step as moved', () => {
        const before = snapshot(buildTrigger(slackStep({ name: 'step_1', channel: '#a', next: slackStep({ name: 'step_2', channel: '#b' }) })))
        const after = snapshot(buildTrigger(slackStep({ name: 'step_2', channel: '#b', next: slackStep({ name: 'step_1', channel: '#a' }) })))
        const kinds = flowStepDiff.diff({ before, after }).map((change) => `${change.kind}:${change.stepName}`)
        expect(kinds).toEqual(['moved:step_2', 'moved:step_1'])
    })
})
