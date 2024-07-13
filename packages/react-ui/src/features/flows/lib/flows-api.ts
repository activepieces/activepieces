import { api } from "@/lib/api";
import { FlowOperationRequest, ListFlowsRequest, PopulatedFlow, SeekPage } from "@activepieces/shared";


export const flowsApi = {
    applyOperation(flowId: string, operation: FlowOperationRequest) {
        return api.post<void>(`/v1/flows/${flowId}`, operation);
    },
    list(request: ListFlowsRequest): Promise<SeekPage<PopulatedFlow>> {
        return api.get<SeekPage<PopulatedFlow>>('/v1/flows', request);
    },
    get(flowId: string): Promise<PopulatedFlow> {
        return api.get<PopulatedFlow>(`/v1/flows/${flowId}`);   
    }
}