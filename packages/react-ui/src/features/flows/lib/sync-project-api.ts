import {
  ConfigureRepoRequest,
  GitBranchType,
  GitRepo,
  ProjectSyncPlan,
  PullGitRepoRequest,
  PushGitRepoRequest,
} from '@activepieces/ee-shared';

import { api } from '@/lib/api';

export const syncProjectApi = {
  cache: new Map<string, GitRepo>(),
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
  async isDevelopment() {
    const repo = await this.get();
    return repo?.branchType === GitBranchType.DEVELOPMENT;
  },
  async isProduction() {
    const repo = await this.get();
    return repo?.branchType === GitBranchType.PRODUCTION;
  },
};
