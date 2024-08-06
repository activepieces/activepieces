import { api } from '@/lib/api';
import { SeekPage } from '@activepieces/shared';

export const projectMembersApi = {
  list(request: any) {
    return api.get<SeekPage<any>>(
      '/v1/project-members',
      request,
    );
  },
  delete(id: string): Promise<void> {
    return api.delete<void>(`/v1/project-members/${id}`);
  },
};
