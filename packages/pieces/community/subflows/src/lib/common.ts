

export const callableFlowKey = (runId: string) => `callableFlow_${runId}`;

export type CallableFlowRequest = {
    data: unknown;
    callbackUrl: string;
}
export type CallableFlowResponse = {
    data: unknown;
}