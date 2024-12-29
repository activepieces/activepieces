import { api } from '@/lib/api';
import {
  ConfigureRepoRequest,
  GitRepo,
  PushGitRepoRequest,
} from '@activepieces/ee-shared';
import { SeekPage } from '@activepieces/shared';

export const gitSyncApi = {
  async get(projectId: string): Promise<GitRepo | null> {
    const response = await api.get<SeekPage<GitRepo>>(`/v1/git-repos`, {
      projectId,
    });
    if (response.data.length === 0) {
      return null;
    }
    return response.data[0];
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
};
