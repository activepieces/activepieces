import {
    apId,
    DefaultProjectRole,
    FlowApprovalRequest,
    FlowApprovalRequestState,
    FlowStatus,
    FlowTriggerType,
    FlowVersion,
    FlowVersionState,
    PropertyExecutionType,
} from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { db } from '../../../helpers/db'
import { createMockFlow, createMockFlowVersion } from '../../../helpers/mocks'
import { createMemberContext, createTestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

const triggerCalls = vi.hoisted(() => {
    const calls: TriggerCall[] = []
    return calls
})

vi.mock('../../../../src/app/trigger/trigger-source/trigger-source-service', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../../../src/app/trigger/trigger-source/trigger-source-service')>()
    return {
        ...actual,
        triggerSourceService: (log: Parameters<typeof actual.triggerSourceService>[0]) => ({
            ...actual.triggerSourceService(log),
            enable: async (params: { flowVersion: { flowId: string }, simulate: boolean, isRepublish?: boolean }) => {
                if (!params.simulate) {
                    triggerCalls.push({ call: 'enable', flowId: params.flowVersion.flowId, isRepublish: params.isRepublish })
                }
                return null
            },
            disable: async (params: { flowId: string, simulate: boolean }) => {
                if (!params.simulate) {
                    triggerCalls.push({ call: 'disable', flowId: params.flowId })
                }
            },
        }),
    }
})

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('republishing a flow through an approval request', () => {
    it.each([
        {
            name: 'keeps the checkpoint of an enabled flow whose trigger is unchanged',
            flowStatus: FlowStatus.ENABLED,
            requestedStatus: FlowStatus.ENABLED,
            republishedInput: { projectId: 'AP' },
            expected: [{ call: 'disable' }, { call: 'enable', isRepublish: true }],
        },
        {
            name: 'resets the checkpoint when the trigger input changed',
            flowStatus: FlowStatus.ENABLED,
            requestedStatus: FlowStatus.ENABLED,
            republishedInput: { projectId: 'OTHER' },
            expected: [{ call: 'disable' }, { call: 'enable', isRepublish: false }],
        },
        {
            name: 'resets the checkpoint when the flow was disabled',
            flowStatus: FlowStatus.DISABLED,
            requestedStatus: FlowStatus.ENABLED,
            republishedInput: { projectId: 'AP' },
            expected: [{ call: 'enable', isRepublish: false }],
        },
        {
            name: 'only disables the old trigger when the approved publish keeps the flow disabled',
            flowStatus: FlowStatus.ENABLED,
            requestedStatus: FlowStatus.DISABLED,
            republishedInput: { projectId: 'AP' },
            expected: [{ call: 'disable' }],
        },
    ])('$name', async ({ flowStatus, requestedStatus, republishedInput, expected }) => {
        const { statusCode, calls } = await approveRepublish({ flowStatus, requestedStatus, republishedInput })

        expect(statusCode).toBe(StatusCodes.OK)
        expect(calls).toEqual(expected)
    })
})

async function approveRepublish({ flowStatus, requestedStatus, republishedInput }: ApproveRepublishParams): Promise<ApproveRepublishResult> {
    const ctx = await createTestContext(app!, { plan: { environmentsEnabled: true } })
    await db.update('project', ctx.project.id, { sensitive: true })
    const memberCtx = await createMemberContext(app!, ctx, { projectRole: DefaultProjectRole.EDITOR })

    const flow = createMockFlow({ projectId: ctx.project.id, status: flowStatus })
    await db.save('flow', flow)
    const published = createMockFlowVersion({ flowId: flow.id, state: FlowVersionState.LOCKED, valid: true, trigger: pollingTrigger({ input: { projectId: 'AP' } }) })
    await db.save('flow_version', published)
    await db.update('flow', flow.id, { publishedVersionId: published.id })
    const republished = createMockFlowVersion({ flowId: flow.id, state: FlowVersionState.LOCKED, valid: true, trigger: pollingTrigger({ input: republishedInput }) })
    await db.save('flow_version', republished)
    const now = new Date().toISOString()
    const approval: FlowApprovalRequest = {
        id: apId(),
        created: now,
        updated: now,
        flowId: flow.id,
        flowVersionId: republished.id,
        projectId: ctx.project.id,
        platformId: ctx.platform.id,
        submitterId: memberCtx.user.id,
        submittedAt: now,
        approverId: null,
        decidedAt: null,
        state: FlowApprovalRequestState.PENDING,
        requestedStatus,
        rejectionReason: null,
    }
    await db.save('flow_approval_request', approval)

    const response = await ctx.post(`/v1/flow-approval-requests/${approval.id}/approve`, {})

    return {
        statusCode: response?.statusCode,
        calls: triggerCalls.filter((call) => call.flowId === flow.id).map(({ call, isRepublish }) => ({ call, isRepublish })),
    }
}

function pollingTrigger({ input }: { input: Record<string, unknown> }): FlowVersion['trigger'] {
    return {
        type: FlowTriggerType.PIECE,
        settings: {
            pieceName: '@activepieces/piece-jira-cloud',
            pieceVersion: '0.4.1',
            triggerName: 'new_issue',
            input,
            propertySettings: {
                projectId: { type: PropertyExecutionType.MANUAL },
            },
        },
        valid: true,
        name: 'trigger',
        displayName: 'New Issue',
        lastUpdatedDate: new Date().toISOString(),
    }
}

type TriggerCall = {
    call: 'enable' | 'disable'
    flowId: string
    isRepublish?: boolean
}

type ApproveRepublishParams = {
    flowStatus: FlowStatus
    requestedStatus: FlowStatus
    republishedInput: Record<string, unknown>
}

type ApproveRepublishResult = {
    statusCode: number | undefined
    calls: Omit<TriggerCall, 'flowId'>[]
}
