import { ListProjectMembersRequestQuery, ProjectMemberWithUser } from "@activepieces/ee-shared";
import { SeekPage } from "../../../../../shared/src";
import { api } from "@/lib/api";


export const projectMembersApi = {
    list(request: ListProjectMembersRequestQuery) {
        console.log(request);
        return api.get<SeekPage<ProjectMemberWithUser>>('/v1/project-members', request);
    }
}

