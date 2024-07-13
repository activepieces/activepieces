import { authenticationSession } from "@/features/authentication/lib/authentication-session";
import { ProjectWithLimits } from "../../../../../shared/src";
import { projectApi } from "./project-api";
import { useQuery, QueryClient } from "@tanstack/react-query";

export const projectHooks = {
    useCurrentProject: () => {
        const query = useQuery<ProjectWithLimits, Error>({
            queryKey: ['current-project'],
            queryFn: projectApi.current,
        });
        return {
            ...query,
            setCurrentProject,
        }
    },
    useProjects: () => {
        return useQuery<ProjectWithLimits[], Error>({
            queryKey: ['projects'],
            queryFn: async () => {
                const results = await projectApi.list({
                    cursor: undefined,
                    limit: 100,
                })
                return results.data
            },
        });
    },
}

const setCurrentProject = async (queryClient: QueryClient, project: ProjectWithLimits) => {
    const projectChanged = authenticationSession.getProjectId() !== project.id
    if (projectChanged) {
        await authenticationSession.switchToSession(project.id);
    }
    queryClient.setQueryData(['current-project'], project);
    if (projectChanged) {
        window.location.reload();
    }
}