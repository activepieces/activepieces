import { api } from "@/lib/api";
import { ListFlowRunsRequestQuery } from "@activepieces/server-shared";
import { FlowRun, SeekPage } from "../../../../../shared/src";

export const flowRunsApi = {
    list(request: ListFlowRunsRequestQuery): Promise<SeekPage<FlowRun>> {
        return api.get<SeekPage<FlowRun>>('/v1/flow-runs', request);
    }
}