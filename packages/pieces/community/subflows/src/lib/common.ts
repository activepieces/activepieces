import { FlowStatus, PopulatedFlow, SeekPage, TriggerType } from "@activepieces/shared";


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

export async function listEnabledWithSubflowsTrigger(context: { flows: { list: () => Promise<SeekPage<PopulatedFlow>> } }) {
    const allFlows = (await context.flows.list()).data;
    const flows = allFlows.filter(
      (flow) =>
        flow.status === FlowStatus.ENABLED &&
        flow.version.trigger.type === TriggerType.PIECE &&
        flow.version.trigger.settings.pieceName ==
        '@activepieces/piece-subflows'
    );
    return flows;
}