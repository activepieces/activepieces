import { FlowStatus, PopulatedFlow, SeekPage, TriggerType } from "@activepieces/shared";
import { FlowsContext, ListFlowsContextParams } from "@activepieces/pieces-framework";


export const callableFlowKey = (runId: string) => `callableFlow_${runId}`;

export type CallableFlowRequest = {
    data: unknown;
    callbackUrl: string;
}
export type CallableFlowResponse = {
    status: 'success' | 'error';
    data: unknown;
}

export const MOCK_CALLBACK_IN_TEST_FLOW_URL = 'MOCK';

export async function listEnabledFlowsWithSubflowTrigger({
    flowsContext,
    params,
}: ListParams) {
    const allFlows = (await flowsContext.list(params)).data;
    const flows = allFlows.filter(
      (flow) =>
        flow.status === FlowStatus.ENABLED &&
        flow.version.trigger.type === TriggerType.PIECE &&
        flow.version.trigger.settings.pieceName ==
        '@activepieces/piece-subflows'
    );
    return flows;
}

type ListParams = {
    flowsContext: FlowsContext,
    params?: ListFlowsContextParams
}