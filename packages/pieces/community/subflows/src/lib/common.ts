

export const callableFlowKey = (runId: string) => `callableFlow_${runId}`;

export type CallableFlowRequest = {
    data: unknown;
    callbackUrl: string;
}
export type CallableFlowResponse = {
    status: 'success' | 'error';
    errorMessage?: string;
    data: unknown;
}

export const MOCK_CALLBACK_IN_TEST_FLOW_URL = 'MOCK';