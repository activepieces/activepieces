import { ActivepiecesError, apId, ApId, ApplicationEventName, Cursor, ErrorCode, Flow, FlowApprovalRequest, FlowApprovalRequestState, FlowOperationType, FlowStatus, FlowVersionState, isNil, PlatformId, PopulatedFlowApprovalRequest, Principal, PrincipalType, ProjectId, SeekPage, UserId } from '@activepieces/shared'
import { FastifyBaseLogger, FastifyRequest } from 'fastify'
import { repoFactory } from '../../../core/db/repo-factory'
import { transaction } from '../../../core/db/transaction'
import { flowExecutionCache } from '../../../flows/flow/flow-execution-cache'
import { flowService } from '../../../flows/flow/flow.service'
import { flowVersionRepo, flowVersionService } from '../../../flows/flow-version/flow-version.service'
import { applicationEvents } from '../../../helper/application-events'
import { buildPaginator } from '../../../helper/pagination/build-paginator'
import { paginationHelper } from '../../../helper/pagination/pagination-utils'
import { Order } from '../../../helper/pagination/paginator'
import { triggerSourceService } from '../../../trigger/trigger-source/trigger-source-service'
import { FlowApprovalRequestEntity } from './flow-approval-request.entity'

const flowApprovalRequestRepo = repoFactory(FlowApprovalRequestEntity)

export const flowApprovalRequestService = (log: FastifyBaseLogger) => ({
    async submitForApproval({ flow, userId, projectId, platformId, requestedStatus }: SubmitParams): Promise<FlowApprovalRequest> {
        const draft = await flowVersionService(log).getFlowVersionOrThrow({
            flowId: flow.id,
            versionId: undefined,
        })
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
            await flowApprovalRequestRepo(entityManager)
                .createQueryBuilder()
                .insert()
                .into(FlowApprovalRequestEntity)
                .values({
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
                .orUpdate(
                    ['flowVersionId', 'submitterId', 'submittedAt', 'requestedStatus'],
                    ['flowId'],
                    { indexPredicate: '"state" = \'PENDING\'' },
                )
                .execute()
            const persisted = await flowApprovalRequestRepo(entityManager).findOneByOrFail({
                flowId: flow.id,
                state: FlowApprovalRequestState.PENDING,
            })
            applicationEvents(log).sendUserEvent({ platformId, userId: userId ?? undefined, projectId }, {
                action: ApplicationEventName.FLOW_APPROVAL_REQUESTED,
                data: {
                    approvalRequestId: persisted.id,
                    flowId: flow.id,
                    flowVersionId: lockedVersion.id,
                    flowDisplayName: lockedVersion.displayName,
                },
            })
            return persisted
        })
    },

    async approve({ requestId, projectId, approverPrincipal, request }: DecideParams): Promise<FlowApprovalRequest> {
        const approval = await this.getOneOrThrow({ requestId, projectId })
        if (approval.state === FlowApprovalRequestState.APPROVED) {
            return approval
        }
        assertStateIsPending(approval.state)

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
        const approverId = approverPrincipal.type === PrincipalType.SERVICE ? null : approverPrincipal.id

        await transaction(async (entityManager) => {
            await flowApprovalRequestRepo(entityManager).update(
                { id: approval.id },
                {
                    state: FlowApprovalRequestState.APPROVED,
                    approverId,
                    decidedAt,
                },
            )
            await flowService(log).setPublishedVersion({ flow, lockedVersion, entityManager })
        })

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
        return {
            ...approval,
            state: FlowApprovalRequestState.APPROVED,
            approverId,
            decidedAt,
        }
    },

    async reject({ requestId, projectId, approverPrincipal, reason, request }: RejectParams): Promise<FlowApprovalRequest> {
        const approval = await this.getOneOrThrow({ requestId, projectId })
        if (approval.state === FlowApprovalRequestState.REJECTED) {
            return approval
        }
        assertStateIsPending(approval.state)

        const lockedVersion = await flowVersionService(log).getFlowVersionOrThrow({
            flowId: approval.flowId,
            versionId: approval.flowVersionId,
        })

        const decidedAt = new Date().toISOString()
        const rejectionReason = reason ?? null
        const approverId = approverPrincipal.type === PrincipalType.SERVICE ? null : approverPrincipal.id

        await flowApprovalRequestRepo().update(
            { id: approval.id },
            {
                state: FlowApprovalRequestState.REJECTED,
                approverId,
                decidedAt,
                rejectionReason,
            },
        )

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
        return {
            ...approval,
            state: FlowApprovalRequestState.REJECTED,
            approverId,
            decidedAt,
            rejectionReason,
        }
    },

    async withdraw({ requestId, projectId, request }: WithdrawParams): Promise<void> {
        const approval = await this.getOneOrThrow({ requestId, projectId })
        assertStateIsPending(approval.state)

        const lockedVersion = await flowVersionService(log).getFlowVersionOrThrow({
            flowId: approval.flowId,
            versionId: approval.flowVersionId,
        })

        await transaction(async (entityManager) => {
            await flowApprovalRequestRepo(entityManager).delete({ id: approval.id })
            await flowVersionRepo(entityManager).update({ id: lockedVersion.id }, { state: FlowVersionState.DRAFT })
        })

        applicationEvents(log).sendUserEvent(request, {
            action: ApplicationEventName.FLOW_APPROVAL_WITHDRAWN,
            data: {
                approvalRequestId: approval.id,
                flowId: approval.flowId,
                flowVersionId: approval.flowVersionId,
                flowDisplayName: lockedVersion.displayName,
            },
        })
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
})

function assertStateIsPending(state: FlowApprovalRequestState): void {
    if (state !== FlowApprovalRequestState.PENDING) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: { message: 'This approval request is no longer pending' },
        })
    }
}

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
