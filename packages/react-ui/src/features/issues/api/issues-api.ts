import { api } from "@/lib/api";
import { Issue, ListIssuesParams } from "@activepieces/ee-shared";
import { SeekPage } from "@activepieces/shared";


export const issuesApi = {
    list(request: ListIssuesParams): Promise<SeekPage<Issue>> {
        return api.get<SeekPage<Issue>>('/v1/issues', request);
    },
}