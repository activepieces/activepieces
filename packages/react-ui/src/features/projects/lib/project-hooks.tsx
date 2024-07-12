import { ProjectWithLimits } from "../../../../../shared/src";
import { projectApi } from "./project-api";
import { useQuery, QueryClient } from "@tanstack/react-query";
import { authenticationSession } from "@/features/authentication/lib/authentication-session";

export const projectHooks = {
    useProject: () => {
        return useQuery<ProjectWithLimits, Error>({
            queryKey: ['current-project', authenticationSession.getProjectId()],
            queryFn: projectApi.current,
        });
    },
    setCurrentProject: (queryClient: QueryClient, project: ProjectWithLimits) => {
        queryClient.setQueryData(['current-project', authenticationSession.getProjectId()], project);
    }
}