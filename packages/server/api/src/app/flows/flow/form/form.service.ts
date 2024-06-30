import { flowVersionService } from '../../flow-version/flow-version.service'
import { flowRepo } from '../flow.repo'
import { logger } from '@activepieces/server-shared'
import { ActivepiecesError, ErrorCode, FlowId, FormInputType, FormResponse, isNil, PopulatedFlow } from '@activepieces/shared'

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

export const formService = {
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