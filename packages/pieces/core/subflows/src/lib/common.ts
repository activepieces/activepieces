import { createHmac, timingSafeEqual } from "node:crypto";
import { FAIL_PARENT_ON_FAILURE_HEADER, FlowStatus, FlowTriggerType, isNil, PARENT_RUN_ID_HEADER, PieceAuth, PopulatedFlow, Property } from "@activepieces/pieces-framework";
import { FlowsContext, ListFlowsContextParams } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";


export const callableFlowKey = (runId: string) => `callableFlow_${runId}`;

export const SUBFLOW_SIGNATURE_HEADER = 'ap-subflow-signature';

export type CallableFlowRequest = {
    data: unknown;
    callbackUrl: string;
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

export async function findEnabledSubflowOrThrow({
    flowsContext,
    externalId,
}: {
    flowsContext: FlowsContext;
    externalId: string | undefined;
}): Promise<PopulatedFlow> {
    const flow = await findFlowByExternalIdOrThrow({ flowsContext, externalId });
    if (flow.status !== FlowStatus.ENABLED) {
        throw new Error(JSON.stringify({
            message: 'The selected subflow is disabled. Enable it before calling it from a parent flow.',
            externalId,
            flowName: flow.version.displayName,
        }));
    }
    return flow;
}

export function subflowDropdown({
    displayName,
    description,
}: {
    displayName: string;
    description: string;
}) {
    return Property.Dropdown<string>({
        auth: PieceAuth.None(),
        displayName,
        description,
        required: true,
        refreshers: [],
        options: async (_, context) => {
            const flows = await listFlowsWithSubflowTrigger({
                flowsContext: context.flows,
            });
            return {
                options: flows.map((flow) => ({
                    value: flow.externalId ?? flow.id,
                    label:
                        flow.status === FlowStatus.ENABLED
                            ? flow.version.displayName
                            : `${flow.version.displayName} (inactive)`,
                })),
            };
        },
    });
}

export async function fetchSubflowSigningSecret({
    apiUrl,
    token,
}: {
    apiUrl: string;
    token: string;
}): Promise<string> {
    const response = await httpClient.sendRequest<{ secret: string }>({
        method: HttpMethod.GET,
        url: `${apiUrl.replace(/\/$/, '')}/v1/engine/subflow-signing-secret`,
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.body.secret;
}

export function signSubflowPayload({
    secret,
    payload,
}: {
    secret: string;
    payload: unknown;
}): string {
    return createHmac('sha256', secret).update(canonicalize(payload)).digest('hex');
}

export function verifySubflowSignature({
    secret,
    payload,
    signature,
}: {
    secret: string;
    payload: unknown;
    signature: string | undefined;
}): boolean {
    if (isNil(signature)) {
        return false;
    }
    const expected = signSubflowPayload({ secret, payload });
    const expectedBuffer = Buffer.from(expected, 'hex');
    const actualBuffer = Buffer.from(signature, 'hex');
    if (expectedBuffer.length !== actualBuffer.length) {
        return false;
    }
    return timingSafeEqual(expectedBuffer, actualBuffer);
}

export async function dispatchToSubflow({
    apiUrl,
    flowId,
    parentRunId,
    failParentOnFailure,
    data,
    callbackUrl,
    signingSecret,
    retries,
}: DispatchToSubflowParams): Promise<unknown> {
    const body = { data, callbackUrl };
    const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${apiUrl.replace(/\/$/, '')}/v1/webhooks/${flowId}`,
        headers: {
            'Content-Type': 'application/json',
            [PARENT_RUN_ID_HEADER]: parentRunId,
            [FAIL_PARENT_ON_FAILURE_HEADER]: failParentOnFailure ? 'true' : 'false',
            [SUBFLOW_SIGNATURE_HEADER]: signSubflowPayload({ secret: signingSecret, payload: body }),
        },
        body,
        retries,
    });
    return response.body;
}

function canonicalize(value: unknown): string {
    if (isNil(value) || typeof value !== 'object') {
        return JSON.stringify(value) ?? 'null';
    }
    if (Array.isArray(value)) {
        return `[${value.map(canonicalize).join(',')}]`;
    }
    const record = value as Record<string, unknown>;
    const entries = Object.keys(record)
        .sort()
        .filter((key) => record[key] !== undefined)
        .map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`);
    return `{${entries.join(',')}}`;
}

type ListParams = {
    flowsContext: FlowsContext,
    params?: ListFlowsContextParams
}

type DispatchToSubflowParams = {
    apiUrl: string;
    flowId: string;
    parentRunId: string;
    failParentOnFailure: boolean;
    data: unknown;
    callbackUrl?: string;
    signingSecret: string;
    retries?: number;
}