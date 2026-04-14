import { FlowActionType, FlowTriggerType, flowStructureUtil, isNil, PopulatedFlow } from '@activepieces/shared'
import { FlowsContext, ListFlowsContextParams } from '@activepieces/pieces-framework'

const SUBFLOWS_PIECE_NAME = '@activepieces/piece-subflows'
const CALL_FLOW_ACTION_NAME = 'callFlow'

async function listFlowsWithSubflowTrigger({ flowsContext, params }: ListParams): Promise<PopulatedFlow[]> {
    const allFlows = (await flowsContext.list(params)).data
    return allFlows.filter(
        (flow) =>
            flow.version.trigger.type === FlowTriggerType.PIECE &&
            flow.version.trigger.settings.pieceName === SUBFLOWS_PIECE_NAME,
    )
}

async function findFlowByExternalIdOrThrow({
    flowsContext,
    externalId,
}: {
    flowsContext: FlowsContext
    externalId: string | undefined
}): Promise<PopulatedFlow> {
    if (isNil(externalId)) {
        throw new Error(JSON.stringify({
            message: 'Please select a flow',
        }))
    }
    const allFlows = await listFlowsWithSubflowTrigger({
        flowsContext,
        params: {
            externalIds: [externalId],
        },
    })
    if (allFlows.length === 0) {
        throw new Error(JSON.stringify({
            message: 'Flow not found',
            externalId,
        }))
    }
    return allFlows[0]
}

async function findParentFlowsCallingChild({
    flowsContext,
    childFlowId,
}: {
    flowsContext: FlowsContext
    childFlowId: string
}): Promise<ParentFlowInfo[]> {
    const allFlows = (await flowsContext.list()).data
    const childFlow = allFlows.find((flow) => flow.id === childFlowId)
    if (isNil(childFlow)) {
        return []
    }
    const childIdentifiers = [childFlow.id, childFlow.externalId].filter((id) => !isNil(id))

    const parents: ParentFlowInfo[] = []
    for (const flow of allFlows) {
        if (flow.id === childFlowId) {
            continue
        }
        const steps = flowStructureUtil.getAllSteps(flow.version.trigger)
        for (const step of steps) {
            if (
                step.type === FlowActionType.PIECE &&
                step.settings.pieceName === SUBFLOWS_PIECE_NAME &&
                step.settings.actionName === CALL_FLOW_ACTION_NAME
            ) {
                const input = step.settings.input ?? {}
                const flowValue = input['flow'] as Record<string, unknown> | undefined
                const targetExternalId = flowValue?.['externalId'] as string | undefined
                if (!isNil(targetExternalId) && childIdentifiers.includes(targetExternalId)) {
                    const flowProps = input['flowProps'] as Record<string, unknown> | undefined
                    parents.push({
                        flow,
                        stepName: step.name,
                        stepDisplayName: step.displayName,
                        payload: flowProps?.['payload'],
                    })
                }
            }
        }
    }
    return parents
}

export const callableFlowKey = (runId: string) => `callableFlow_${runId}`

export const MOCK_CALLBACK_IN_TEST_FLOW_URL = 'MOCK'

export const subflowsCommon = {
    listFlowsWithSubflowTrigger,
    findFlowByExternalIdOrThrow,
    findParentFlowsCallingChild,
    SUBFLOWS_PIECE_NAME,
}

export type CallableFlowRequest = {
    data: unknown
    callbackUrl: string
}

export type CallableFlowResponse = {
    status: 'success' | 'error'
    data: unknown
}

export type ParentFlowInfo = {
    flow: PopulatedFlow
    stepName: string
    stepDisplayName: string
    payload: unknown
}

type ListParams = {
    flowsContext: FlowsContext
    params?: ListFlowsContextParams
}
