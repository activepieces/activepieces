import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { DISPATCH_KEY_HEADER, FAIL_PARENT_ON_FAILURE_HEADER, FlowTriggerType, isNil, PARENT_RUN_ID_HEADER, PopulatedFlow } from "@activepieces/pieces-framework";
import { FlowsContext, ListFlowsContextParams } from "@activepieces/pieces-framework";


export const callableFlowKey = (runId: string) => `callableFlow_${runId}`;

export type CallableFlowRequest = {
    data: unknown;
    callbackUrl?: string;
}
export type CallableFlowResponse = {
    status: 'success' | 'error';
    data: unknown;
}

export const MOCK_CALLBACK_IN_TEST_FLOW_URL = 'MOCK';

export async function listFlowsWithSubflowTrigger({
    flowsContext,
    params,
}: ListParams): Promise<PopulatedFlow[]> {
    // The framework context types this leanly as PopulatedFlowSummary, but the
    // engine returns full PopulatedFlow records (with version) at runtime.
    const allFlows = (await flowsContext.list(params)).data as unknown as PopulatedFlow[];
    const flows = allFlows.filter(
        (flow) =>
            flow.version.trigger.type === FlowTriggerType.PIECE &&
            flow.version.trigger.settings.pieceName ==
            '@activepieces/piece-subflows'
    );
    return flows;
}

export async function findFlowByExternalIdOrThrow({
    flowsContext,
    externalId,
}: {
    flowsContext: FlowsContext;
    externalId: string | undefined;
}): Promise<PopulatedFlow> {
    if (isNil(externalId)) {
        throw new Error(JSON.stringify({
            message: 'Please select a flow',
        }));
    }
    const externalIds = [externalId];
    const allFlows = await listFlowsWithSubflowTrigger({
        flowsContext,
        params: {
            externalIds
        }
    });
    if (allFlows.length === 0) {
        throw new Error(JSON.stringify({
            message: 'Flow not found',
            externalId,
        }));
    }
    return allFlows[0];
}

export async function dispatchChild({ apiUrl, flowId, payload, parentRunId, failParentOnFailure, callbackUrl, dispatchKey }: DispatchChildParams): Promise<unknown> {
    const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${apiUrl}v1/webhooks/${flowId}`,
        headers: {
            'Content-Type': 'application/json',
            [PARENT_RUN_ID_HEADER]: parentRunId,
            [FAIL_PARENT_ON_FAILURE_HEADER]: failParentOnFailure ? 'true' : 'false',
            ...(isNil(dispatchKey) ? {} : { [DISPATCH_KEY_HEADER]: dispatchKey }),
        },
        body: {
            data: payload,
            callbackUrl,
        },
    });
    return response.body;
}

type ListParams = {
    flowsContext: FlowsContext,
    params?: ListFlowsContextParams
}

type DispatchChildParams = {
    apiUrl: string;
    flowId: string;
    payload: unknown;
    parentRunId: string;
    failParentOnFailure: boolean;
    callbackUrl?: string;
    dispatchKey?: string;
}