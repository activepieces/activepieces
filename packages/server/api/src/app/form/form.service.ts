import { flowService } from '../flows/flow/flow.service'

export const formService = {
    getFormByFlowId: async (flowId: string) => {
        const flow = flowService.getPopulatedFlowById(flowId)
        return flow
    },
}

export const FORMS_PIECE_NAME = '@activepieces/piece-forms'
export const FORMS_TRIGGER_NAMES = [
    'form_submission',
    'file_submission',
]