import {
    apId,
    DefaultProjectRole,
    Flow,
    FlowApprovalRequest,
    FlowApprovalRequestState,
    FlowStatus,
    FlowVersion,
    FlowVersionState,
} from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { flowApprovalRequestService } from '../../../../src/app/ee/flows/flow-approval/flow-approval-request.service'
import { eeFlowPublishHook } from '../../../../src/app/ee/flows/flow-approval/flow-publish-hook'
import { db } from '../../../helpers/db'
import {
    createMockFlow,
    createMockFlowVersion,
} from '../../../helpers/mocks'
import {
    createMemberContext,
    createTestContext,
    TestContext,
} from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

async function setupSensitiveCtx(): Promise<TestContext> {
    const ctx = await createTestContext(app!, {
        plan: { environmentsEnabled: true },
    })
    await db.update('project', ctx.project.id, { sensitive: true })
    return ctx
}

async function createDraftFlow(ctx: TestContext): Promise<{ flow: Flow, version: FlowVersion }> {
    const flow = createMockFlow({
        projectId: ctx.project.id,
        status: FlowStatus.DISABLED,
    })
    await db.save('flow', flow)
    const version = createMockFlowVersion({
        flowId: flow.id,
        state: FlowVersionState.DRAFT,
        valid: true,
    })
    await db.save('flow_version', version)
    return { flow, version }
}

async function seedPendingApproval(ctx: TestContext, submitterId: string): Promise<{ flow: Flow, version: FlowVersion, approval: FlowApprovalRequest }> {
    const flow = createMockFlow({
        projectId: ctx.project.id,
        status: FlowStatus.DISABLED,
    })
    await db.save('flow', flow)
    const version = createMockFlowVersion({
        flowId: flow.id,
        state: FlowVersionState.LOCKED,
        valid: true,
    })
    await db.save('flow_version', version)
    const now = new Date().toISOString()
    const approval: FlowApprovalRequest = {
        id: apId(),
        created: now,
        updated: now,
        flowId: flow.id,
        flowVersionId: version.id,
        projectId: ctx.project.id,
        platformId: ctx.platform.id,
        submitterId,
        submittedAt: now,
        approverId: null,
        decidedAt: null,
        state: FlowApprovalRequestState.PENDING,
        requestedStatus: FlowStatus.DISABLED,
        rejectionReason: null,
    }
    await db.save('flow_approval_request', approval)
    return { flow, version, approval }
}

describe('flow-approval — routing', () => {
    it('returns PUBLISH_NOW when environments are disabled', async () => {
        const ctx = await createTestContext(app!, {
            plan: { environmentsEnabled: false },
        })
        const route = await eeFlowPublishHook(app!.log).routePublish({
            flow: createMockFlow({ projectId: ctx.project.id }),
            projectId: ctx.project.id,
            platformId: ctx.platform.id,
            userId: ctx.user.id,
        })
        expect(route).toBe('PUBLISH_NOW')
    })

    it('returns PUBLISH_NOW when project is not sensitive', async () => {
        const ctx = await createTestContext(app!, {
            plan: { environmentsEnabled: true },
        })
        const route = await eeFlowPublishHook(app!.log).routePublish({
            flow: createMockFlow({ projectId: ctx.project.id }),
            projectId: ctx.project.id,
            platformId: ctx.platform.id,
            userId: ctx.user.id,
        })
        expect(route).toBe('PUBLISH_NOW')
    })

    it('returns PUBLISH_NOW when submitter has PUBLISH_SENSITIVE_FLOW_ACCESS', async () => {
        const ctx = await setupSensitiveCtx()
        const route = await eeFlowPublishHook(app!.log).routePublish({
            flow: createMockFlow({ projectId: ctx.project.id }),
            projectId: ctx.project.id,
            platformId: ctx.platform.id,
            userId: ctx.user.id,
        })
        expect(route).toBe('PUBLISH_NOW')
    })

    it('returns NEEDS_APPROVAL for a sensitive project + non-admin submitter', async () => {
        const ctx = await setupSensitiveCtx()
        const memberCtx = await createMemberContext(app!, ctx, {
            projectRole: DefaultProjectRole.EDITOR,
        })
        const route = await eeFlowPublishHook(app!.log).routePublish({
            flow: createMockFlow({ projectId: ctx.project.id }),
            projectId: ctx.project.id,
            platformId: ctx.platform.id,
            userId: memberCtx.user.id,
        })
        expect(route).toBe('NEEDS_APPROVAL')
    })
})

describe('flow-approval — submitForApproval race', () => {
    it('two concurrent submits produce exactly one PENDING row', async () => {
        const ctx = await setupSensitiveCtx()
        const { flow } = await createDraftFlow(ctx)

        const results = await Promise.allSettled([
            flowApprovalRequestService(app!.log).submitForApproval({
                flow,
                userId: ctx.user.id,
                projectId: ctx.project.id,
                platformId: ctx.platform.id,
                requestedStatus: FlowStatus.ENABLED,
            }),
            flowApprovalRequestService(app!.log).submitForApproval({
                flow,
                userId: ctx.user.id,
                projectId: ctx.project.id,
                platformId: ctx.platform.id,
                requestedStatus: FlowStatus.ENABLED,
            }),
        ])

        const fulfilled = results.filter((r) => r.status === 'fulfilled')
        const rejected = results.filter((r) => r.status === 'rejected')
        expect(fulfilled).toHaveLength(1)
        expect(rejected).toHaveLength(1)

        const rows = await db.findOneBy<FlowApprovalRequest>('flow_approval_request', {
            flowId: flow.id,
            state: FlowApprovalRequestState.PENDING,
        })
        expect(rows).not.toBeNull()
    })
})

describe('flow-approval — approve', () => {
    it('approver can approve a pending request and the flow gets published', async () => {
        const ctx = await setupSensitiveCtx()
        const memberCtx = await createMemberContext(app!, ctx, {
            projectRole: DefaultProjectRole.EDITOR,
        })
        const { flow, version, approval } = await seedPendingApproval(ctx, memberCtx.user.id)

        const response = await ctx.post(`/v1/flow-approval-requests/${approval.id}/approve`, {})

        expect(response?.statusCode).toBe(StatusCodes.OK)
        const updated = await db.findOneByOrFail<FlowApprovalRequest>('flow_approval_request', { id: approval.id })
        expect(updated.state).toBe(FlowApprovalRequestState.APPROVED)
        expect(updated.approverId).toBe(ctx.user.id)

        const reloadedFlow = await db.findOneByOrFail<Flow>('flow', { id: flow.id })
        expect(reloadedFlow.publishedVersionId).toBe(version.id)
    })

    it('approve is idempotent — second call returns same approved row, flow unchanged', async () => {
        const ctx = await setupSensitiveCtx()
        const memberCtx = await createMemberContext(app!, ctx, {
            projectRole: DefaultProjectRole.EDITOR,
        })
        const { flow, approval } = await seedPendingApproval(ctx, memberCtx.user.id)

        const first = await ctx.post(`/v1/flow-approval-requests/${approval.id}/approve`, {})
        expect(first?.statusCode).toBe(StatusCodes.OK)
        const flowAfterFirst = await db.findOneByOrFail<Flow>('flow', { id: flow.id })

        const second = await ctx.post(`/v1/flow-approval-requests/${approval.id}/approve`, {})
        expect(second?.statusCode).toBe(StatusCodes.OK)
        const flowAfterSecond = await db.findOneByOrFail<Flow>('flow', { id: flow.id })

        expect(flowAfterSecond.publishedVersionId).toBe(flowAfterFirst.publishedVersionId)
        expect(new Date(flowAfterSecond.updated).toISOString()).toEqual(
            new Date(flowAfterFirst.updated).toISOString(),
        )
    })
})

describe('flow-approval — reject', () => {
    it('approver can reject a pending request with a reason', async () => {
        const ctx = await setupSensitiveCtx()
        const memberCtx = await createMemberContext(app!, ctx, {
            projectRole: DefaultProjectRole.EDITOR,
        })
        const { flow, approval } = await seedPendingApproval(ctx, memberCtx.user.id)

        const response = await ctx.post(`/v1/flow-approval-requests/${approval.id}/reject`, {
            reason: 'Missing tests',
        })

        expect(response?.statusCode).toBe(StatusCodes.OK)
        const updated = await db.findOneByOrFail<FlowApprovalRequest>('flow_approval_request', { id: approval.id })
        expect(updated.state).toBe(FlowApprovalRequestState.REJECTED)
        expect(updated.rejectionReason).toBe('Missing tests')

        const reloadedFlow = await db.findOneByOrFail<Flow>('flow', { id: flow.id })
        expect(reloadedFlow.publishedVersionId).toBeNull()
    })
})

describe('flow-approval — withdraw', () => {
    it('submitter can withdraw a pending request; row deleted and version returns to DRAFT', async () => {
        const ctx = await setupSensitiveCtx()
        const memberCtx = await createMemberContext(app!, ctx, {
            projectRole: DefaultProjectRole.EDITOR,
        })
        const { version, approval } = await seedPendingApproval(ctx, memberCtx.user.id)

        const response = await memberCtx.post(`/v1/flow-approval-requests/${approval.id}/withdraw`, {})

        expect(response?.statusCode).toBe(StatusCodes.NO_CONTENT)
        const row = await db.findOneBy<FlowApprovalRequest>('flow_approval_request', { id: approval.id })
        expect(row).toBeNull()
        const reloadedVersion = await db.findOneByOrFail<FlowVersion>('flow_version', { id: version.id })
        expect(reloadedVersion.state).toBe(FlowVersionState.DRAFT)
    })
})

describe('flow-approval — module gating', () => {
    it('returns 402 when environmentsEnabled is false', async () => {
        const ctx = await createTestContext(app!, {
            plan: { environmentsEnabled: false },
        })
        const response = await ctx.get('/v1/flow-approval-requests', {
            projectId: ctx.project.id,
        })
        expect(response?.statusCode).toBe(StatusCodes.PAYMENT_REQUIRED)
    })
})
