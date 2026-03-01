import { ActivepiecesError, ChatUIResponse, ErrorCode, FlowId, flowStructureUtil, FormInputType, FormResponse, isNil, PieceTrigger, PopulatedFlow } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { pieceMetadataService } from '../../../pieces/metadata/piece-metadata-service'
import { platformService } from '../../../platform/platform.service'
import { projectService } from '../../../project/project-service'
import { flowVersionService } from '../../flow-version/flow-version.service'
import { flowRepo } from '../flow.repo'

const FORMS_PIECE_NAME = '@activepieces/piece-forms'
const FORM_TRIIGGER = 'form_submission'
const FILE_TRIGGER = 'file_submission'
const SIMPLE_FILE_PROPS = {
    inputs: [
        {
            displayName: 'File',
            description: '',
            type: FormInputType.FILE,
            required: true,
        },
    ],
    waitForResponse: true,
}
const FORMS_TRIGGER_NAMES = [
    FORM_TRIIGGER,
    FILE_TRIGGER,
]

function isFormTrigger(flow: PopulatedFlow | null): flow is PopulatedFlow {
    if (isNil(flow)) {
        return false
    }
    const triggerNode = flowStructureUtil.getTriggerNode(flow.version.graph)
    if (isNil(triggerNode)) {
        return false
    }
    const triggerData = triggerNode.data as PieceTrigger
    return triggerData.settings.pieceName === FORMS_PIECE_NAME && FORMS_TRIGGER_NAMES.includes(triggerData.settings.triggerName!)
}

export const humanInputService = (log: FastifyBaseLogger) => ({
    getFormByFlowIdOrThrow: async (flowId: string, useDraft: boolean): Promise<FormResponse> => {
        const flow = await getPopulatedFlowById(log, flowId, useDraft)
        if (!isFormTrigger(flow)) {
            throw new ActivepiecesError({
                code: ErrorCode.FLOW_FORM_NOT_FOUND,
                params: {
                    flowId,
                    message: 'Flow form not found in draft version of flow.',
                },
            })
        }
        const triggerNode = flowStructureUtil.getTriggerNode(flow.version.graph)!
        const triggerData = triggerNode.data as PieceTrigger
        const pieceVersion = await pieceMetadataService(log).resolveExactVersion({
            name: FORMS_PIECE_NAME,
            version: triggerData.settings.pieceVersion,
            platformId: await projectService.getPlatformId(flow.projectId),
        })
        return {
            id: flow.id,
            title: flow.version.displayName,
            props: triggerData.settings.triggerName === FILE_TRIGGER ? SIMPLE_FILE_PROPS : triggerData.settings.input as FormResponse['props'],
            projectId: flow.projectId,
            version: pieceVersion,
        }
    },
    getChatUIByFlowIdOrThrow: async (flowId: string, useDraft: boolean): Promise<ChatUIResponse> => {
        const flow = await getPopulatedFlowById(log, flowId, useDraft)
        const triggerNode = flow ? flowStructureUtil.getTriggerNode(flow.version.graph) : undefined
        const triggerData = triggerNode?.data as PieceTrigger | undefined
        if (!flow
            || triggerData?.settings.triggerName !== 'chat_submission'
            || triggerData?.settings.pieceName !== FORMS_PIECE_NAME) {
            throw new ActivepiecesError({
                code: ErrorCode.FLOW_FORM_NOT_FOUND,
                params: {
                    flowId,
                    message: 'Flow chat ui not found in draft version of flow.',
                },
            })
        }
        const platformId = await projectService.getPlatformId(flow.projectId)
        const platform = await platformService.getOneOrThrow(platformId)
        return {
            id: flow.id,
            title: flow.version.displayName,
            props: triggerData.settings.input as ChatUIResponse['props'],
            projectId: flow.projectId,
            platformLogoUrl: platform.logoIconUrl,
            platformName: platform.name,
        }
    },
})

async function getPopulatedFlowById(log: FastifyBaseLogger, id: FlowId, useDraft: boolean): Promise<PopulatedFlow | null> {
    const flow = await flowRepo().findOneBy({ id })
    if (isNil(flow) || (isNil(flow.publishedVersionId) && !useDraft)) {
        return null
    }
    const flowVersion = await flowVersionService(log).getFlowVersionOrThrow({
        flowId: id,
        versionId: useDraft ? undefined : flow.publishedVersionId!,
    })
    return {
        ...flow,
        version: flowVersion,
    }
}
