import { issuesApi } from "../api/issues-api";
import { authenticationSession } from "@/features/authentication/lib/authentication-session";
import { useQuery } from "@tanstack/react-query";

export const issueHooks = {
    useIssuesNotification: () => {
        return useQuery<boolean, Error>({
            queryKey: ['issues-notification', authenticationSession.getProjectId()],
            queryFn: async () => {
                console.log('useIssuesNotification');
                const count = await issuesApi.count();
                return count > 0;
            },
            staleTime: Infinity,
        });
    }
}