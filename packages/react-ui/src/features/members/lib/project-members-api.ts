// Stub for removed members feature
import { api } from '@/lib/api';

import { ProjectMemberWithUser } from '@/lib/ee-shared-stub';
import { SeekPage } from '@activepieces/shared';

export const projectMembersApi = {
  list: (params: { projectId: string }) =>
    api.get<SeekPage<ProjectMemberWithUser>>('/v1/project-members', params),
  upsert: (_request: unknown) => api.post('/v1/project-members', {}),
  delete: (_id: string) => api.delete('/v1/project-members'),
};
