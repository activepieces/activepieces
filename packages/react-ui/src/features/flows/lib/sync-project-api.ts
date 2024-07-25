import { api } from '@/lib/api';
import {
  ConfigureRepoRequest,
  GitRepo,
  ProjectSyncPlan,
  PullGitRepoRequest,
  PushGitRepoRequest,
} from '@activepieces/ee-shared';

export const syncProjectApi = {
  get() {
    return api.get<GitRepo>(`/v1/git-repos`);
  },
  configure(request: ConfigureRepoRequest) {
    return api.post<GitRepo>(`/v1/git-repos`, request);
  },
  disconnect(repoId: string) {
    return api.delete<void>(`/v1/git-repos/${repoId}`);
  },
  push(repoId: string, request: PushGitRepoRequest) {
    return api.post<void>(`/v1/git-repos/${repoId}/push`, request);
  },
  pull(repoId: string, request: PullGitRepoRequest) {
    return api.post<ProjectSyncPlan>(`/v1/git-repos/${repoId}/pull`, request);
  },
};
