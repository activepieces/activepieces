import { apId } from '@activepieces/core-utils'
import { AppConnection, DefaultProjectRole, FlowApprovalRequest, FlowApprovalRequestState, FlowStatus, FlowVersionState } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { db } from '../../../helpers/db'
import {
    createMockConnection,
    createMockFlow,
    createMockFlowVersion,
} from '../../../helpers/mocks'
import { createMemberContext, createTestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('POST /v1/app-connections/replace in a sensitive project', () => {
    it('refuses to delete the source before changing any flow when the republish needs approval', async () => {
        const ctx = await createTestContext(app!, {
            plan: { environmentsEnabled: true },
        })
        await db.update('project', ctx.project.id, { sensitive: true })
        const memberCtx = await createMemberContext(app!, ctx, {
            projectRole: DefaultProjectRole.EDITOR,
        })

        const source = createMockConnection({
            platformId: ctx.platform.id,
            projectIds: [ctx.project.id],
            pieceName: '@activepieces/piece-slack',
        }, ctx.user.id)
        const target = createMockConnection({
            platformId: ctx.platform.id,
            projectIds: [ctx.project.id],
            pieceName: '@activepieces/piece-slack',
        }, ctx.user.id)
        await db.save('app_connection', [source, target])

        const flow = createMockFlow({ projectId: ctx.project.id, status: FlowStatus.DISABLED })
        await db.save('flow', flow)
        const publishedVersion = createMockFlowVersion({
            flowId: flow.id,
            state: FlowVersionState.LOCKED,
            connectionIds: [source.externalId],
        })
        await db.save('flow_version', publishedVersion)
        flow.publishedVersionId = publishedVersion.id
        await db.save('flow', flow)

        const response = await memberCtx.post('/v1/app-connections/replace', {
            sourceAppConnectionId: source.id,
            targetAppConnectionId: target.id,
            projectId: ctx.project.id,
            deleteSourceConnection: true,
            applyToPublishedVersions: true,
        })

        expect(response?.statusCode).toBe(StatusCodes.CONFLICT)
        expect(response?.json().params.message).toContain('needs approval')
        const stillThere = await db.findOneBy<AppConnection>('app_connection', { id: source.id })
        expect(stillThere?.id).toBe(source.id)
        const versions = await db.findBy('flow_version', { flowId: flow.id })
        expect(versions).toHaveLength(1)
        const pendingApprovals = await db.findBy('flow_approval_request', { flowId: flow.id })
        expect(pendingApprovals).toHaveLength(0)
    })

    it('refuses to delete the source while a pending publish request uses it', async () => {
        const ctx = await createTestContext(app!, {
            plan: { environmentsEnabled: true },
        })
        await db.update('project', ctx.project.id, { sensitive: true })

        const source = createMockConnection({
            platformId: ctx.platform.id,
            projectIds: [ctx.project.id],
            pieceName: '@activepieces/piece-slack',
        }, ctx.user.id)
        const target = createMockConnection({
            platformId: ctx.platform.id,
            projectIds: [ctx.project.id],
            pieceName: '@activepieces/piece-slack',
        }, ctx.user.id)
        await db.save('app_connection', [source, target])

        const flow = createMockFlow({ projectId: ctx.project.id, status: FlowStatus.DISABLED })
        await db.save('flow', flow)
        const submittedVersion = createMockFlowVersion({
            flowId: flow.id,
            state: FlowVersionState.LOCKED,
            connectionIds: [source.externalId],
        })
        await db.save('flow_version', submittedVersion)
        const now = new Date().toISOString()
        const approval: FlowApprovalRequest = {
            id: apId(),
            created: now,
            updated: now,
            flowId: flow.id,
            flowVersionId: submittedVersion.id,
            projectId: ctx.project.id,
            platformId: ctx.platform.id,
            submitterId: ctx.user.id,
            submittedAt: now,
            approverId: null,
            decidedAt: null,
            state: FlowApprovalRequestState.PENDING,
            requestedStatus: FlowStatus.DISABLED,
            rejectionReason: null,
        }
        await db.save('flow_approval_request', approval)

        const response = await ctx.post('/v1/app-connections/replace', {
            sourceAppConnectionId: source.id,
            targetAppConnectionId: target.id,
            projectId: ctx.project.id,
            deleteSourceConnection: true,
            applyToPublishedVersions: true,
        })

        expect(response?.statusCode).toBe(StatusCodes.CONFLICT)
        expect(response?.json().params.message).toContain('waiting for publish approval')
        const stillThere = await db.findOneBy<AppConnection>('app_connection', { id: source.id })
        expect(stillThere?.id).toBe(source.id)
        const pendingApprovals = await db.findBy<FlowApprovalRequest>('flow_approval_request', { flowId: flow.id })
        expect(pendingApprovals.map((request) => request.flowVersionId)).toEqual([submittedVersion.id])
    })
})
