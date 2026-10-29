import { FlowStatus, FlowTriggerType, FlowVersion, FlowVersionState, PropertyExecutionType } from '@activepieces/shared'
import { describe, expect, it } from 'vitest'
import { flowPublishUtils } from '../../../../../src/app/flows/flow/flow-publish-utils'

function pieceTrigger(overrides: { pieceName?: string, pieceVersion?: string, triggerName?: string, input?: Record<string, unknown> } = {}): FlowVersion['trigger'] {
    return {
        type: FlowTriggerType.PIECE,
        settings: {
            pieceName: overrides.pieceName ?? '@activepieces/piece-jira-cloud',
            pieceVersion: overrides.pieceVersion ?? '0.4.1',
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

describe('flowPublishUtils.isRepublish', () => {
    it('is true when the flow was live and is republished enabled with the same trigger', () => {
        expect(flowPublishUtils.isRepublish({
            previouslyPublished: versionWith(pieceTrigger()),
            toPublish: versionWith(pieceTrigger()),
            requestedStatus: FlowStatus.ENABLED,
        })).toBe(true)
    })

    it('is false when there was no live version', () => {
        expect(flowPublishUtils.isRepublish({
            previouslyPublished: undefined,
            toPublish: versionWith(pieceTrigger()),
            requestedStatus: FlowStatus.ENABLED,
        })).toBe(false)
    })

    it('is false when the publish leaves the flow disabled', () => {
        expect(flowPublishUtils.isRepublish({
            previouslyPublished: versionWith(pieceTrigger()),
            toPublish: versionWith(pieceTrigger()),
            requestedStatus: FlowStatus.DISABLED,
        })).toBe(false)
    })

    it('is false when the trigger input changed', () => {
        expect(flowPublishUtils.isRepublish({
            previouslyPublished: versionWith(pieceTrigger()),
            toPublish: versionWith(pieceTrigger({ input: { projectId: 'OPS', maxResults: 50 } })),
            requestedStatus: FlowStatus.ENABLED,
        })).toBe(false)
    })
})

describe('flowPublishUtils.isTriggerUnchanged', () => {
    it('is true for a republish that keeps the piece version', () => {
        expect(flowPublishUtils.isTriggerUnchanged({
            previouslyPublished: versionWith(pieceTrigger()),
            toPublish: versionWith(pieceTrigger()),
            requestedStatus: FlowStatus.ENABLED,
        })).toBe(true)
    })

    it('is false when the piece was upgraded, even with the same inputs', () => {
        expect(flowPublishUtils.isTriggerUnchanged({
            previouslyPublished: versionWith(pieceTrigger()),
            toPublish: versionWith(pieceTrigger({ pieceVersion: '0.5.0' })),
            requestedStatus: FlowStatus.ENABLED,
        })).toBe(false)
    })

    it('is false when it is not a republish', () => {
        expect(flowPublishUtils.isTriggerUnchanged({
            previouslyPublished: undefined,
            toPublish: versionWith(pieceTrigger()),
            requestedStatus: FlowStatus.ENABLED,
        })).toBe(false)
    })
})

function versionWith(trigger: FlowVersion['trigger']): FlowVersion {
    return {
        id: 'version-id',
        created: '2026-08-04T00:00:00.000Z',
        updated: '2026-08-04T00:00:00.000Z',
        flowId: 'flow-id',
        displayName: 'Flow',
        trigger,
        updatedBy: null,
        valid: true,
        schemaVersion: null,
        state: FlowVersionState.LOCKED,
        connectionIds: [],
        agentIds: [],
        notes: [],
        backupFiles: null,
    }
}
