import { logger } from '@activepieces/server-shared'
import { ActivepiecesError, ChatUIResponse, ErrorCode, FlowId, FormInputType, FormResponse, isNil, PopulatedFlow } from '@activepieces/shared'
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

export const humanInputService = {
    getFormByFlowIdOrThrow: async (flowId: string, useDraft: boolean): Promise<FormResponse> => {
        const flow = await getPopulatedFlowById(flowId, useDraft)
        if (!flow
            || !FORMS_TRIGGER_NAMES.includes(flow.version.trigger.settings.triggerName)
            || flow.version.trigger.settings.pieceName !== FORMS_PIECE_NAME) {
            throw new ActivepiecesError({
                code: ErrorCode.FLOW_FORM_NOT_FOUND,
                params: {
                    flowId,
                    message: 'Flow form not found in draft version of flow.',
                },
            })
        }
        logger.info(flow.version.trigger.settings)
        const triggerName = flow.version.trigger.settings.triggerName
        return {
            id: flow.id,
            title: flow.version.displayName,
            props: triggerName === FILE_TRIGGER ? SIMPLE_FILE_PROPS : flow.version.trigger.settings.input,
            projectId: flow.projectId,
        }
    },
    getChatUIByFlowIdOrThrow: async (flowId: string, useDraft: boolean): Promise<ChatUIResponse> => {
        const flow = await getPopulatedFlowById(flowId, useDraft)
        if (!flow
            || flow.version.trigger.settings.triggerName !== 'chat_submission'
            || flow.version.trigger.settings.pieceName !== FORMS_PIECE_NAME) {
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
            props: flow.version.trigger.settings.input,
            projectId: flow.projectId,
            platformLogoUrl: platform.logoIconUrl,
            platformName: platform.name,
        }
    },
}

async function getPopulatedFlowById(id: FlowId, useDraft: boolean): Promise<PopulatedFlow | null> {
    const flow = await flowRepo().findOneBy({ id })
    if (isNil(flow) || (isNil(flow.publishedVersionId) && !useDraft)) {
        return null
    }
    const flowVersion = await flowVersionService.getFlowVersionOrThrow({
        flowId: id,
        versionId: useDraft ? undefined : flow.publishedVersionId!,
    })
    return {
        ...flow,
        version: flowVersion,
    }
}