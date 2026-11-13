import { ActivepiecesError, ErrorCode, FlowId, FlowRunId, FlowVersionId, isNil, omit, PlatformId, ProjectId, tryCatch } from '@activepieces/core-utils'
import { ExecutionType, FlowRun, FlowRunStatus, flowStructureUtil, RunEnvironment, StreamStepProgress } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { EntityManager } from 'typeorm'
import { projectService } from '../../project/project-service'
import { flowVersionService } from '../flow-version/flow-version.service'
import { addToQueue, cancelSingleRun, flowRunRepo } from './flow-run-service'
import { flowRunSideEffects } from './flow-run-side-effects'

export const childRunDispatchService = (log: FastifyBaseLogger) => ({
    async prepareChildDispatch({ projectId, parentRunId, entryStepName }: PrepareChildDispatchParams): Promise<ChildDispatchTarget> {
        const parentRun = await flowRunRepo().findOneBy({ id: parentRunId, projectId })
        if (isNil(parentRun)) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: { message: `The parent run ${parentRunId} does not exist in this project, so no child can be dispatched for it.` },
            })
        }
        const flowVersion = await flowVersionService(log).getOneOrThrow(parentRun.flowVersionId)
        const entryStep = flowStructureUtil.getStep(entryStepName, flowVersion.trigger)
        if (isNil(entryStep) || !flowStructureUtil.isAction(entryStep.type)) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: { message: `The step ${entryStepName} is not an action in this flow version, so a child run cannot start from it.` },
            })
        }
        return {
            projectId,
            parentRunId,
            entryStepName,
            flowId: parentRun.flowId,
            flowVersionId: parentRun.flowVersionId,
            environment: parentRun.environment,
            platformId: await projectService(log).getPlatformId(projectId),
        }
    },

    async createChildRuns({ target, parentWaitpointId, children, entityManager }: CreateChildRunsParams): Promise<FlowRun[]> {
        const now = new Date().toISOString()
        const childRuns: FlowRun[] = children.map(({ id, dispatchIndex }) => ({
            id,
            projectId: target.projectId,
            flowId: target.flowId,
            flowVersionId: target.flowVersionId,
            environment: target.environment,
            parentRunId: target.parentRunId,
            parentWaitpointId,
            dispatchIndex,
            failParentOnFailure: false,
            status: FlowRunStatus.QUEUED,
            created: now,
            updated: now,
            tags: [],
            steps: {},
        }))
        if (childRuns.length > 0) {
            await flowRunRepo(entityManager).insert(childRuns.map((childRun) => omit(childRun, ['steps'])))
        }
        return childRuns
    },

    async enqueueChildRun({ target, childRun, seedSteps }: EnqueueChildRunParams): Promise<void> {
        await addToQueue({
            flowRun: childRun,
            platformId: target.platformId,
            payload: seedSteps,
            entryStepName: target.entryStepName,
            preferInlinePayload: true,
            executionType: ExecutionType.BEGIN,
            executeTrigger: false,
            workerHandlerId: undefined,
            httpRequestId: undefined,
            streamStepProgress: StreamStepProgress.NONE,
        }, log)
    },

    async reportChildRunStarted({ target, childRun }: ChildRunParams): Promise<void> {
        const logFields = { flowRun: { id: childRun.id, dispatchIndex: childRun.dispatchIndex }, project: { id: target.projectId }, waitpoint: { id: childRun.parentWaitpointId } }
        const { error } = await tryCatch(() => flowRunSideEffects(log).onStart({ flowRun: childRun, platformId: target.platformId }))
        if (error) {
            log.error({ ...logFields, error }, '[childRunDispatchService#reportChildRunStarted] Child run was enqueued but its start side effects failed')
        }
        log.info(logFields, '[childRunDispatchService#reportChildRunStarted] Child run dispatched')
    },

    async cancelUnstartedChildRun({ target, childRun }: ChildRunParams): Promise<void> {
        await cancelSingleRun(log, childRun, target.platformId)
    },

    async deleteChildRun({ id, projectId, entityManager }: DeleteChildRunParams): Promise<void> {
        await flowRunRepo(entityManager).delete({ id, projectId })
    },
})

type PrepareChildDispatchParams = {
    projectId: ProjectId
    parentRunId: FlowRunId
    entryStepName: string
}

type CreateChildRunsParams = {
    target: ChildDispatchTarget
    parentWaitpointId: string
    children: { id: FlowRunId, dispatchIndex: number }[]
    entityManager: EntityManager
}

type EnqueueChildRunParams = {
    target: ChildDispatchTarget
    childRun: FlowRun
    seedSteps: Record<string, unknown>
}

type ChildRunParams = {
    target: ChildDispatchTarget
    childRun: FlowRun
}

type DeleteChildRunParams = {
    id: FlowRunId
    projectId: ProjectId
    entityManager: EntityManager
}

export type ChildDispatchTarget = {
    projectId: ProjectId
    parentRunId: FlowRunId
    entryStepName: string
    flowId: FlowId
    flowVersionId: FlowVersionId
    environment: RunEnvironment
    platformId: PlatformId
}
