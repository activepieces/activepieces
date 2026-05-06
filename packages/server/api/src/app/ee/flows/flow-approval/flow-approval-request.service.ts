import { ActivepiecesError, apId, ApId, ApplicationEventName, Cursor, ErrorCode, Flow, FlowApprovalRequest, FlowApprovalRequestState, FlowOperationType, FlowStatus, FlowVersionState, isNil, PlatformId, PopulatedFlowApprovalRequest, Principal, ProjectId, SeekPage, UserId } from '@activepieces/shared'
import { FastifyBaseLogger, FastifyRequest } from 'fastify'
import { transaction } from '../../../core/db/transaction'
import { flowExecutionCache } from '../../../flows/flow/flow-execution-cache'
import { flowService } from '../../../flows/flow/flow.service'
import { flowVersionRepo, flowVersionService } from '../../../flows/flow-version/flow-version.service'
import { applicationEvents } from '../../../helper/application-events'
import { buildPaginator } from '../../../helper/pagination/build-paginator'
import { paginationHelper } from '../../../helper/pagination/pagination-utils'
import Paginator, { Order } from '../../../helper/pagination/paginator'
import { triggerSourceService } from '../../../trigger/trigger-source/trigger-source-service'
import { FlowApprovalRequestEntity } from './flow-approval-request.entity'
import { flowApprovalRequestRepo } from './flow-approval-request.repo'

export const flowApprovalRequestService = (log: FastifyBaseLogger) => ({
    async submitForApproval({ flow, userId, projectId, platformId, requestedStatus }: SubmitParams): Promise<FlowApprovalRequest> {
        const draft = await flowVersionService(log).getFlowVersionOrThrow({
            flowId: flow.id,
            versionId: undefined,
        })
        const existingPending = await flowApprovalRequestRepo().findOne({
            where: { flowId: flow.id, state: FlowApprovalRequestState.PENDING },
        })
        if (!isNil(existingPending)) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: { message: 'A pending approval request already exists for this flow' },
            })
        }
        return transaction(async (entityManager) => {
            const lockedVersion = draft.state === FlowVersionState.LOCKED
                ? draft
                : await flowVersionService(log).applyOperation({
                    userId,
                    projectId,
                    platformId,
                    flowVersion: draft,
                    userOperation: { type: FlowOperationType.LOCK_FLOW, request: {} },
                    entityManager,
                })
            const now = new Date().toISOString()
            const created = await flowApprovalRequestRepo(entityManager).save({
                id: apId(),
                flowId: flow.id,
                flowVersionId: lockedVersion.id,
                projectId,
                platformId,
                submitterId: userId ?? null,
                submittedAt: now,
                approverId: null,
                decidedAt: null,
                state: FlowApprovalRequestState.PENDING,
                requestedStatus,
                rejectionReason: null,
            })
            applicationEvents(log).sendUserEvent({ platformId, userId: userId ?? undefined, projectId }, {
                action: ApplicationEventName.FLOW_APPROVAL_REQUESTED,
                data: {
                    approvalRequestId: created.id,
                    flowId: flow.id,
                    flowVersionId: lockedVersion.id,
                    flowDisplayName: lockedVersion.displayName,
                },
            })
            return created
        })
    },

    async approve({ requestId, projectId, approverPrincipal, request }: DecideParams): Promise<FlowApprovalRequest> {
        const approval = await this.getOneOrThrow({ requestId, projectId })
        const flow = await flowService(log).getOneOrThrow({ id: approval.flowId, projectId: approval.projectId })
        const lockedVersion = await flowVersionService(log).getFlowVersionOrThrow({
            flowId: flow.id,
            versionId: approval.flowVersionId,
        })

        if (flow.status === FlowStatus.ENABLED && !isNil(flow.publishedVersionId)) {
            await triggerSourceService(log).disable({
                flowId: flow.id,
                projectId: flow.projectId,
                simulate: false,
                ignoreError: true,
            })
        }

        const decidedAt = new Date().toISOString()
        const result = await transaction(async (entityManager) => {
            const update = await flowApprovalRequestRepo(entityManager)
                .createQueryBuilder()
                .update()
                .set({
                    state: FlowApprovalRequestState.APPROVED,
                    approverId: approverPrincipal.id,
                    decidedAt,
                })
                .where('id = :id AND state = :pending', {
                    id: approval.id,
                    pending: FlowApprovalRequestState.PENDING,
                })
                .execute()

            if (update.affected === 1) {
                await flowService(log).setPublishedVersion({ flow, lockedVersion, entityManager })
                const row: FlowApprovalRequest = {
                    ...approval,
                    state: FlowApprovalRequestState.APPROVED,
                    approverId: approverPrincipal.id,
                    decidedAt,
                }
                return { row, applied: true }
            }
            const current = await flowApprovalRequestRepo(entityManager).findOneByOrFail({ id: approval.id })
            if (current.state === FlowApprovalRequestState.APPROVED) {
                return { row: current, applied: false }
            }
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: { message: 'This approval request is no longer pending' },
            })
        })

        if (result.applied) {
            await flowExecutionCache(log).invalidate(flow.id)
            await flowService(log).applyStatusChangeForPublishedFlow({
                id: flow.id,
                projectId: approval.projectId,
                newStatus: approval.requestedStatus,
            })
            applicationEvents(log).sendUserEvent(request, {
                action: ApplicationEventName.FLOW_APPROVAL_GRANTED,
                data: {
                    approvalRequestId: approval.id,
                    flowId: flow.id,
                    flowVersionId: approval.flowVersionId,
                    flowDisplayName: lockedVersion.displayName,
                },
            })
        }
        return result.row
    },

    async reject({ requestId, projectId, approverPrincipal, reason, request }: RejectParams): Promise<FlowApprovalRequest> {
        const approval = await this.getOneOrThrow({ requestId, projectId })
        const lockedVersion = await flowVersionService(log).getFlowVersionOrThrow({
            flowId: approval.flowId,
            versionId: approval.flowVersionId,
        })

        const decidedAt = new Date().toISOString()
        const rejectionReason = reason ?? null
        const result = await transaction(async (entityManager) => {
            const update = await flowApprovalRequestRepo(entityManager)
                .createQueryBuilder()
                .update()
                .set({
                    state: FlowApprovalRequestState.REJECTED,
                    approverId: approverPrincipal.id,
                    decidedAt,
                    rejectionReason,
                })
                .where('id = :id AND state = :pending', {
                    id: approval.id,
                    pending: FlowApprovalRequestState.PENDING,
                })
                .execute()

            if (update.affected === 1) {
                const row: FlowApprovalRequest = {
                    ...approval,
                    state: FlowApprovalRequestState.REJECTED,
                    approverId: approverPrincipal.id,
                    decidedAt,
                    rejectionReason,
                }
                return { row, applied: true }
            }
            const current = await flowApprovalRequestRepo(entityManager).findOneByOrFail({ id: approval.id })
            if (current.state === FlowApprovalRequestState.REJECTED) {
                return { row: current, applied: false }
            }
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: { message: 'This approval request is no longer pending' },
            })
        })

        if (result.applied) {
            applicationEvents(log).sendUserEvent(request, {
                action: ApplicationEventName.FLOW_APPROVAL_REJECTED,
                data: {
                    approvalRequestId: approval.id,
                    flowId: approval.flowId,
                    flowVersionId: approval.flowVersionId,
                    flowDisplayName: lockedVersion.displayName,
                    rejectionReason: reason ?? null,
                },
            })
        }
        return result.row
    },

    async withdraw({ requestId, projectId, request }: WithdrawParams): Promise<void> {
        const approval = await this.getOneOrThrow({ requestId, projectId })
        const lockedVersion = await flowVersionService(log).getFlowVersionOrThrow({
            flowId: approval.flowId,
            versionId: approval.flowVersionId,
        })

        const applied = await transaction(async (entityManager) => {
            const remove = await flowApprovalRequestRepo(entityManager)
                .createQueryBuilder()
                .delete()
                .where('id = :id AND state = :pending', {
                    id: approval.id,
                    pending: FlowApprovalRequestState.PENDING,
                })
                .execute()
            if (remove.affected === 0) {
                const current = await flowApprovalRequestRepo(entityManager).findOneBy({ id: approval.id })
                if (isNil(current)) {
                    return false
                }
                throw new ActivepiecesError({
                    code: ErrorCode.VALIDATION,
                    params: { message: 'This approval request is no longer pending' },
                })
            }
            await flowVersionRepo(entityManager).update({ id: lockedVersion.id }, { state: FlowVersionState.DRAFT })
            return true
        })

        if (applied) {
            applicationEvents(log).sendUserEvent(request, {
                action: ApplicationEventName.FLOW_APPROVAL_WITHDRAWN,
                data: {
                    approvalRequestId: approval.id,
                    flowId: approval.flowId,
                    flowVersionId: approval.flowVersionId,
                    flowDisplayName: lockedVersion.displayName,
                },
            })
        }
    },

    async getOneOrThrow({ requestId, projectId }: { requestId: ApId, projectId: ProjectId }): Promise<FlowApprovalRequest> {
        const approval = await flowApprovalRequestRepo().findOne({
            where: { id: requestId, projectId },
        })
        if (isNil(approval)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityType: 'FlowApprovalRequest', entityId: requestId },
            })
        }
        return approval
    },

    async list({ projectId, state, flowVersionId, cursor, limit }: ListParams): Promise<SeekPage<PopulatedFlowApprovalRequest>> {
        const decoded = paginationHelper.decodeCursor(cursor)
        const paginator = buildPaginator({
            entity: FlowApprovalRequestEntity,
            alias: 'far',
            query: {
                limit: limit ?? 50,
                orderBy: [{ field: 'created', order: Order.DESC }],
                afterCursor: decoded.nextCursor,
                beforeCursor: decoded.previousCursor,
            },
        })
        const qb = flowApprovalRequestRepo()
            .createQueryBuilder('far')
            .leftJoinAndMapOne(
                'far.flowVersion',
                'flow_version',
                'fv',
                'fv.id = far."flowVersionId"',
            )
            .where({ projectId })
        if (state) {
            qb.andWhere({ state })
        }
        if (flowVersionId) {
            qb.andWhere({ flowVersionId })
        }
        const result = await paginator.paginate<FlowApprovalRequest & { flowVersion?: { id: string, displayName: string, flowId: string, state: FlowVersionState, created: string, updated: string } }>(qb)
        const populated: PopulatedFlowApprovalRequest[] = result.data.map((row) => ({
            ...row,
            flowVersion: row.flowVersion
                ? {
                    id: row.flowVersion.id,
                    displayName: row.flowVersion.displayName,
                    flowId: row.flowVersion.flowId,
                    state: row.flowVersion.state,
                    created: row.flowVersion.created,
                    updated: row.flowVersion.updated,
                }
                : undefined,
        }))
        return paginationHelper.createPage(populated, result.cursor)
    },

    async withdrawAllPendingForPlatform(platformId: PlatformId): Promise<number> {
        const pending = await flowApprovalRequestRepo().find({
            where: { platformId, state: FlowApprovalRequestState.PENDING },
            select: ['id', 'flowVersionId'],
        })
        if (pending.length === 0) {
            return 0
        }
        await transaction(async (entityManager) => {
            const ids = pending.map((row) => row.id)
            const versionIds = pending.map((row) => row.flowVersionId)
            await flowApprovalRequestRepo(entityManager)
                .createQueryBuilder()
                .delete()
                .where('id IN (:...ids) AND state = :pending', {
                    ids,
                    pending: FlowApprovalRequestState.PENDING,
                })
                .execute()
            await flowVersionRepo(entityManager)
                .createQueryBuilder()
                .update()
                .set({ state: FlowVersionState.DRAFT })
                .where('id IN (:...versionIds)', { versionIds })
                .execute()
        })
        return pending.length
    },
})

type SubmitParams = {
    flow: Flow
    userId: UserId | null
    projectId: ProjectId
    platformId: PlatformId
    requestedStatus: FlowStatus
}

type DecideParams = {
    requestId: ApId
    projectId: ProjectId
    approverPrincipal: Principal
    request: FastifyRequest
}

type RejectParams = DecideParams & {
    reason?: string
}

type WithdrawParams = {
    requestId: ApId
    projectId: ProjectId
    request: FastifyRequest
}

type ListParams = {
    projectId: ProjectId
    state?: FlowApprovalRequestState
    flowVersionId?: ApId
    cursor?: Cursor
    limit?: number
}
