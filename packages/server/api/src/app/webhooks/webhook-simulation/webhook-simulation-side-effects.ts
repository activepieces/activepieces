import {
    ActivepiecesError,
    EngineResponseStatus,
    ErrorCode,
    FlowId,
    FlowVersionId,
    isNil,
    PopulatedFlow,
    ProjectId,
} from '@activepieces/shared'
import { flowService } from '../../flows/flow/flow.service'
import { triggerHooks } from '../../flows/trigger'

type BaseParams = {
    projectId: ProjectId
    flowId: FlowId
    flowVersionId?: FlowVersionId
}

type GetFlowParams = BaseParams
type PreCreateParams = BaseParams
type PreDeleteParams = BaseParams

const getFlowOrThrow = async ({
    projectId,
    flowId,
    flowVersionId,
}: GetFlowParams): Promise<PopulatedFlow> => {
    return flowService.getOnePopulatedOrThrow({
        id: flowId,
        projectId,
        versionId: flowVersionId,
    })
}

export const webhookSideEffects = {
    async preCreate({ projectId, flowId }: PreCreateParams): Promise<void> {
        const { version: flowVersion } = await getFlowOrThrow({
            flowId,
            projectId,
        })

        const response = await triggerHooks.enable({
            projectId,
            flowVersion,
            simulate: true,
        })

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
        const { version: flowVersion } = await getFlowOrThrow({
            flowId,
            projectId,
            flowVersionId,
        })

        await triggerHooks.disable({
            projectId,
            flowVersion,
            simulate: true,
        })
    },
}
