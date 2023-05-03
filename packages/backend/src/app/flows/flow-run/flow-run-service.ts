import {
    apId,
    Cursor,
    ExecutionOutputStatus,
    FileId,
    FlowRun,
    FlowRunId,
    FlowVersionId,
    ProjectId,
    SeekPage,
    RunEnvironment,
    TelemetryEventName,
    ApEdition,
} from '@activepieces/shared'
import { getEdition } from '../../helper/secret-helper'
import { databaseConnection } from '../../database/database-connection'
import { flowVersionService } from '../../flows/flow-version/flow-version.service'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { Order } from '../../helper/pagination/paginator'
import { telemetry } from '../../helper/telemetry.utils'
import { FlowRunEntity } from './flow-run-entity'
import { flowRunSideEffects } from './flow-run-side-effects'
import { usageService } from '@ee/billing/backend/usage.service'
import { logger } from '../../helper/logger'
import { notifications } from '../../helper/notifications'
import { flowRepo } from '../flow/flow.repo'

export const repo = databaseConnection.getRepository(FlowRunEntity)

export const flowRunService = {
    async list({ projectId, cursor, limit }: ListParams): Promise<SeekPage<FlowRun>> {
        const decodedCursor = paginationHelper.decodeCursor(cursor)
        const paginator = buildPaginator({
            entity: FlowRunEntity,
            query: {
                limit,
                order: Order.DESC,
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })

        const query = repo.createQueryBuilder('flow_run').where({
            projectId,
            environment: RunEnvironment.PRODUCTION,
        })
        const { data, cursor: newCursor } = await paginator.paginate(query)
        return paginationHelper.createPage<FlowRun>(data, newCursor)
    },

    async finish(
        flowRunId: FlowRunId,
        status: ExecutionOutputStatus,
        logsFileId: FileId | null,
        tasks: number,
    ): Promise<FlowRun> {
        await repo.update(flowRunId, {
            logsFileId,
            status,
            finishTime: new Date().toISOString(),
        })
        const flowRun = (await this.getOne({ id: flowRunId, projectId: undefined }))!
        const edition = await getEdition()
        if (edition === ApEdition.ENTERPRISE) {
            await usageService.addTasksConsumed({
                projectId: flowRun.projectId,
                tasks: tasks,
            })
        }
        notifications.notifyRun({
            flowRun: flowRun,
        })
        return flowRun
    },

    async start({ flowVersionId, payload, environment }: StartParams): Promise<FlowRun> {
        logger.info(`[flowRunService#start]  flowVersionId=${flowVersionId}`)

        const flowVersion = await flowVersionService.getOneOrThrow(flowVersionId)
        const flow = (await flowRepo.findOneBy({ id: flowVersion.flowId }))!

        await usageService.limit({
            projectId: flow.projectId,
            flowVersion,
        })

        const flowRun: Partial<FlowRun> = {
            id: apId(),
            projectId: flow.projectId,
            flowId: flowVersion.flowId,
            flowVersionId: flowVersion.id,
            environment: environment,
            flowDisplayName: flowVersion.displayName,
            status: ExecutionOutputStatus.RUNNING,
            startTime: new Date().toISOString(),
        }

        const savedFlowRun = await repo.save(flowRun)

        telemetry.trackProject(flow.projectId, {
            name: TelemetryEventName.FLOW_RUN_CREATED,
            payload: {
                projectId: savedFlowRun.projectId,
                flowId: savedFlowRun.flowId,
                environment: savedFlowRun.environment,
            },
        })
        await flowRunSideEffects.start({
            flowRun: savedFlowRun,
            payload,
        })

        return savedFlowRun
    },

    async getOne({ projectId, id }: GetOneParams): Promise<FlowRun | null> {
        return await repo.findOneBy({
            projectId,
            id,
        })
    },
}


type ListParams = {
    projectId: ProjectId
    cursor: Cursor | null
    limit: number
}

type GetOneParams = {
    id: FlowRunId
    projectId: ProjectId | undefined
}

type StartParams = {
    environment: RunEnvironment
    flowVersionId: FlowVersionId
    payload: unknown
}
