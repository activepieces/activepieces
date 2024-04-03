import { flowVersionService } from '../../flow-version/flow-version.service'
import { flowRepo } from '../flow.repo'
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
    getFormByFlowIdOrThrow: async (flowId: string): Promise<FormResponse> => {
        const flow = await getPopulatedFlowById(flowId)
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
        const triggerName = flow.version.trigger.settings.triggerName
        if (triggerName === FILE_TRIGGER) {
            return {
                id: flow.id,
                title: flow.version.displayName,
                props: SIMPLE_FILE_PROPS,
                projectId: flow.projectId,
            }
        }
        return {
            id: flow.id,
            title: flow.version.displayName,
            props: flow.version.trigger.settings.input,
            projectId: flow.projectId,
        }
    },
}


async function getPopulatedFlowById(id: FlowId): Promise<PopulatedFlow | null> {
    const flow = await flowRepo().findOneBy({ id })
    if (isNil(flow)) {
        return null
    }
    const flowVersion = await flowVersionService.getFlowVersionOrThrow({
        flowId: id,
        versionId: undefined,
    })
    return {
        ...flow,
        version: flowVersion,
    }
}