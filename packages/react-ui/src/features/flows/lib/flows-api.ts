import { authenticationSession } from "@/features/authentication/lib/authentication-session";
import { api } from "@/lib/api";
import { FlowOperationRequest, ListFlowsRequest, PopulatedFlow, SeekPage } from "@activepieces/shared";


export const flowsApi = {
    applyOperation(flowId: string, operation: FlowOperationRequest) {
        return api.post<void>(`/v1/flows/${flowId}`, operation);
    },
    list(request: ListFlowsRequest): Promise<SeekPage<PopulatedFlow>> {
        return api.get<SeekPage<PopulatedFlow>>('/v1/flows', request);
    }
}