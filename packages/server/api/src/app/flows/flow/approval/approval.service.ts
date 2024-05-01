import { flowVersionService } from '../../flow-version/flow-version.service'
import { flowRepo } from '../flow.repo'
import { ActivepiecesError, ApprovalResponse, ErrorCode, FlowId, isNil, PopulatedFlow } from '@activepieces/shared'

// type ApprovalRequestParam = 'approved' | 'denied'

const APPROVAL_PIECE_NAME = '@activepieces/piece-approval'

export const approvalService = {
    getApprovalByFlowIdOrThrow: async (flowId: string, action: string): Promise<ApprovalResponse> => {
        const flow = await getPopulatedFlowById(flowId)
        if (!flow || flow.version.trigger.settings.pieceName !== APPROVAL_PIECE_NAME) {
            throw new ActivepiecesError({
                code: ErrorCode.FLOW_FORM_NOT_FOUND,
                params: {
                    flowId,
                    message: 'Flow form not found in draft version of flow.',
                },
            })
        }
        return {
            approved: action === 'approved',
            denied: action === 'denied',
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