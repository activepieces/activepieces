import { api } from '@/lib/api';

export const syncProjectApi = {
  get() {
    return api.get<any>(`/v1/git-repos`);
  },
  configure(request: any) {
    return api.post<any>(`/v1/git-repos`, request);
  },
  disconnect(repoId: string) {
    return api.delete<void>(`/v1/git-repos/${repoId}`);
  },
  push(repoId: string, request: any) {
    return api.post<void>(`/v1/git-repos/${repoId}/push`, request);
  },
  pull(repoId: string, request: any) {
    return api.post<ProjectSyncPlan>(`/v1/git-repos/${repoId}/pull`, request);
  },
};
