import {
    ActivepiecesError,
    EngineResponseStatus,
    ErrorCode,
    FlowId,
    FlowVersionId,
    isNil,
    ProjectId,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { flowService } from '../../flows/flow/flow.service'
import { triggerHooks } from '../../flows/trigger'

type BaseParams = {
    projectId: ProjectId
    flowId: FlowId
    flowVersionId?: FlowVersionId
}

type PreCreateParams = BaseParams
type PreDeleteParams = BaseParams

export const webhookSideEffects = (log: FastifyBaseLogger) => ({
    async preCreate({ projectId, flowId }: PreCreateParams): Promise<void> {
        const { version: flowVersion } = await flowService(log).getOnePopulatedOrThrow({
            id: flowId,
            projectId,
        })

        const response = await triggerHooks.enable({
            projectId,
            flowVersion,
            simulate: true,
        }, log)

        if (isNil(response) || response.status !== EngineResponseStatus.OK) {
            throw new ActivepiecesError({
                code: ErrorCode.TRIGGER_ENABLE,
                params: {
                    flowVersionId: flowVersion.id,
                },
            })
        }
    },

    async preDelete({
        projectId,
        flowId,
        flowVersionId,
    }: PreDeleteParams): Promise<void> {
        const { version: flowVersion } = await flowService(log).getOnePopulatedOrThrow({
            id: flowId,
            projectId,
            versionId: flowVersionId,
        })

        await triggerHooks.disable(
            {
                projectId,
                flowVersion,
                simulate: true,
            },
            log,
        )
    },
})
