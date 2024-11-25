import {
    ActivepiecesError,
    apId,
    Cursor,
    ErrorCode,
    FileCompression,
    FileType,
    FlowId,
    getPieceMajorAndMinorVersion,
    PieceTrigger,
    PlatformId,
    PopulatedFlow,
    ProjectId,
    SeekPage,
    Trigger,
    TriggerEventWithPayload,
    TriggerHookType,
    TriggerType,
} from '@activepieces/shared'
import { engineRunner, webhookUtils } from 'server-worker'
import { accessTokenManager } from '../../authentication/lib/access-token-manager'
import { repoFactory } from '../../core/db/repo-factory'
import { fileService } from '../../file/file.service'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { Order } from '../../helper/pagination/paginator'
import { flowService } from '../flow/flow.service'
import { TriggerEventEntity } from './trigger-event.entity'

export const triggerEventRepo = repoFactory(TriggerEventEntity)

export const triggerEventService = {
    async saveEvent({
        projectId,
        flowId,
        payload,
    }: SaveEventParams): Promise<TriggerEventWithPayload> {
        const flow = await flowService.getOnePopulatedOrThrow({
            id: flowId,
            projectId,
        })

        const data = Buffer.from(JSON.stringify(payload))
        const file = await fileService.save({
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
        platformId,
        flow,
    }: TestParams): Promise<SeekPage<TriggerEventWithPayload>> {
        const trigger = flow.version.trigger
        const emptyPage = paginationHelper.createPage<TriggerEventWithPayload>([], null)
        switch (trigger.type) {
            case TriggerType.PIECE: {
                const engineToken = await accessTokenManager.generateEngineToken({
                    projectId,
                    platformId,
                })
                const { result: testResult } = await engineRunner.executeTrigger(engineToken, {
                    hookType: TriggerHookType.TEST,
                    flowVersion: flow.version,
                    webhookUrl: await webhookUtils.getWebhookUrl({
                        flowId: flow.id,
                        simulate: true,
                    }),
                    test: true, 
                    projectId,
                })
                await triggerEventRepo().delete({
                    projectId,
                    flowId: flow.id,
                })
                if (!testResult.success) {
                    throw new ActivepiecesError({
                        code: ErrorCode.TEST_TRIGGER_FAILED,
                        params: {
                            message: testResult.message!,
                        },
                    })
                }

                for (const output of testResult.output) {
                    await triggerEventService.saveEvent({
                        projectId,
                        flowId: flow.id,
                        payload: output,
                    })
                }

                return triggerEventService.list({
                    projectId,
                    flow,
                    cursor: null,
                    limit: testResult.output.length,
                })
            }
            case TriggerType.EMPTY:
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
            const fileData = await fileService.getDataOrThrow({
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
}

function getSourceName(trigger: Trigger): string {
    switch (trigger.type) {
        case TriggerType.PIECE: {
            const pieceTrigger = trigger as PieceTrigger
            const pieceName = pieceTrigger.settings.pieceName
            const pieceVersion = getPieceMajorAndMinorVersion(
                pieceTrigger.settings.pieceVersion,
            )
            const triggerName = pieceTrigger.settings.triggerName
            return `${pieceName}@${pieceVersion}:${triggerName}`
        }

        case TriggerType.EMPTY:
            return trigger.type
    }
}

type TestParams = {
    projectId: ProjectId
    platformId: PlatformId
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
