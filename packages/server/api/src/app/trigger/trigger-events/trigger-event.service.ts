import {
    ActivepiecesError,
    apId,
    Cursor,
    ErrorCode,
    FileCompression,
    FileType,
    FlowId,
    FlowTrigger,
    FlowTriggerType,
    getPieceMajorAndMinorVersion,
    PieceTrigger,
    PopulatedFlow,
    ProjectId,
    SeekPage,
    TriggerEventWithPayload,
    TriggerHookType,
    WorkerJobType,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { EngineHelperResponse, EngineHelperTriggerResult } from 'server-worker'
import { repoFactory } from '../../core/db/repo-factory'
import { fileService } from '../../file/file.service'
import { flowService } from '../../flows/flow/flow.service'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { Order } from '../../helper/pagination/paginator'
import { projectService } from '../../project/project-service'
import { userInteractionWatcher } from '../../workers/user-interaction-watcher'
import { TriggerEventEntity } from './trigger-event.entity'

export const triggerEventRepo = repoFactory(TriggerEventEntity)

export const triggerEventService = (log: FastifyBaseLogger) => ({
    async saveEvent({
        projectId,
        flowId,
        payload,
    }: SaveEventParams): Promise<TriggerEventWithPayload> {
        const flow = await flowService(log).getOnePopulatedOrThrow({
            id: flowId,
            projectId,
        })

        const data = Buffer.from(JSON.stringify(payload))
        const file = await fileService(log).save({
            projectId,
            fileName: `${apId()}.json`,
            data,
            size: data.length,
            type: FileType.TRIGGER_EVENT_FILE,
            compression: FileCompression.NONE,
        })
        const sourceName = getSourceName(flow.version.trigger)

        const trigger = await triggerEventRepo().save({
            id: apId(),
            fileId: file.id,
            projectId,
            flowId: flow.id,
            sourceName,
        })
        return {
            ...trigger,
            payload,
        }
    },

    async test({
        projectId,
        flow,
    }: TestParams): Promise<SeekPage<TriggerEventWithPayload>> {
        const trigger = flow.version.trigger
        const platformId = await projectService.getPlatformId(projectId)
        const emptyPage = paginationHelper.createPage<TriggerEventWithPayload>([], null)
        switch (trigger.type) {
            case FlowTriggerType.PIECE: {

                const engineResponse = await userInteractionWatcher(log).submitAndWaitForResponse<EngineHelperResponse<EngineHelperTriggerResult<TriggerHookType.TEST>>>({
                    hookType: TriggerHookType.TEST,
                    flowVersion: flow.version,
                    test: true,
                    projectId,
                    jobType: WorkerJobType.EXECUTE_TRIGGER_HOOK,
                    platformId,
                })
                await triggerEventRepo().delete({
                    projectId,
                    flowId: flow.id,
                })
                if (!engineResponse.result.success) {
                    throw new ActivepiecesError({
                        code: ErrorCode.TEST_TRIGGER_FAILED,
                        params: {
                            message: engineResponse.result.message!,
                        },
                    })
                }

                for (const output of engineResponse.result.output) {
                    await this.saveEvent({
                        projectId,
                        flowId: flow.id,
                        payload: output,
                    })
                }

                return this.list({
                    projectId,
                    flow,
                    cursor: null,
                    limit: engineResponse.result.output.length,
                })
            }
            case FlowTriggerType.EMPTY:
                return emptyPage
        }
    },

    async list({
        projectId,
        flow,
        cursor,
        limit,
    }: ListParams): Promise<SeekPage<TriggerEventWithPayload>> {
        const decodedCursor = paginationHelper.decodeCursor(cursor)
        const sourceName = getSourceName(flow.version.trigger)
        const flowId = flow.id
        const paginator = buildPaginator({
            entity: TriggerEventEntity,
            query: {
                limit,
                order: Order.DESC,
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })
        const query = triggerEventRepo().createQueryBuilder('trigger_event').where({
            projectId,
            flowId,
            sourceName,
        })
        const { data, cursor: newCursor } = await paginator.paginate(query)
        const dataWithPayload = await Promise.all(data.map(async (triggerEvent) => {
            const fileData = await fileService(log).getDataOrThrow({
                fileId: triggerEvent.fileId,
            })
            const decodedPayload = JSON.parse(fileData.data.toString())
            return {
                ...triggerEvent,
                payload: decodedPayload,
            }
        }))
        return paginationHelper.createPage<TriggerEventWithPayload>(dataWithPayload, newCursor)
    },
})

function getSourceName(trigger: FlowTrigger): string {
    switch (trigger.type) {
        case FlowTriggerType.PIECE: {
            const pieceTrigger = trigger as PieceTrigger
            const pieceName = pieceTrigger.settings.pieceName
            const pieceVersion = getPieceMajorAndMinorVersion(
                pieceTrigger.settings.pieceVersion,
            )
            const triggerName = pieceTrigger.settings.triggerName
            return `${pieceName}@${pieceVersion}:${triggerName}`
        }

        case FlowTriggerType.EMPTY:
            return trigger.type
    }
}

type TestParams = {
    projectId: ProjectId
    flow: PopulatedFlow
}

type SaveEventParams = {
    projectId: ProjectId
    flowId: FlowId
    payload: unknown
}

type ListParams = {
    projectId: ProjectId
    flow: PopulatedFlow
    cursor: Cursor | null
    limit: number
}
