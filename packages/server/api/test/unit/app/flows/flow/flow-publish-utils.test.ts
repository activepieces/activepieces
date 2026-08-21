import { FlowTriggerType, FlowVersion, PropertyExecutionType } from '@activepieces/shared'
import { describe, expect, it } from 'vitest'
import { flowPublishUtils } from '../../../../../src/app/flows/flow/flow-publish-utils'

function pieceTrigger(overrides: { pieceName?: string, triggerName?: string, input?: Record<string, unknown> } = {}): FlowVersion['trigger'] {
    return {
        type: FlowTriggerType.PIECE,
        settings: {
            pieceName: overrides.pieceName ?? '@activepieces/piece-jira-cloud',
            pieceVersion: '0.4.1',
            triggerName: overrides.triggerName ?? 'new_issue',
            input: overrides.input ?? { projectId: 'AP', maxResults: 50 },
            propertySettings: {
                projectId: { type: PropertyExecutionType.MANUAL },
            },
        },
        valid: true,
        name: 'trigger',
        displayName: 'New Issue',
        lastUpdatedDate: '2026-08-04T00:00:00.000Z',
    }
}

const emptyTrigger: FlowVersion['trigger'] = {
    type: FlowTriggerType.EMPTY,
    settings: {},
    valid: false,
    name: 'trigger',
    displayName: 'Select Trigger',
    lastUpdatedDate: '2026-08-04T00:00:00.000Z',
}

describe('flowPublishUtils.isSameTrigger', () => {
    it('is true when piece, trigger name and input all match', () => {
        expect(flowPublishUtils.isSameTrigger({
            published: pieceTrigger(),
            toPublish: pieceTrigger(),
        })).toBe(true)
    })

    it('ignores key order in the input', () => {
        expect(flowPublishUtils.isSameTrigger({
            published: pieceTrigger({ input: { projectId: 'AP', maxResults: 50 } }),
            toPublish: pieceTrigger({ input: { maxResults: 50, projectId: 'AP' } }),
        })).toBe(true)
    })

    it('is false when the trigger was swapped', () => {
        expect(flowPublishUtils.isSameTrigger({
            published: pieceTrigger({ triggerName: 'new_issue' }),
            toPublish: pieceTrigger({ triggerName: 'updated_issue' }),
        })).toBe(false)
    })

    it('is false when the piece was swapped', () => {
        expect(flowPublishUtils.isSameTrigger({
            published: pieceTrigger({ pieceName: '@activepieces/piece-jira-cloud' }),
            toPublish: pieceTrigger({ pieceName: '@activepieces/piece-linear' }),
        })).toBe(false)
    })

    it('is false when the input now points at a different resource', () => {
        expect(flowPublishUtils.isSameTrigger({
            published: pieceTrigger({ input: { projectId: 'AP', maxResults: 50 } }),
            toPublish: pieceTrigger({ input: { projectId: 'OPS', maxResults: 50 } }),
        })).toBe(false)
    })

    it('is false when a nested input value changed', () => {
        expect(flowPublishUtils.isSameTrigger({
            published: pieceTrigger({ input: { filter: { status: ['open'] } } }),
            toPublish: pieceTrigger({ input: { filter: { status: ['open', 'closed'] } } }),
        })).toBe(false)
    })

    it('is false for a non-piece trigger', () => {
        expect(flowPublishUtils.isSameTrigger({
            published: emptyTrigger,
            toPublish: emptyTrigger,
        })).toBe(false)
    })
})
