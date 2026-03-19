import { KnowledgeBaseFile } from '@activepieces/shared';

import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';

export const knowledgeBaseApi = {
  list(): Promise<KnowledgeBaseFile[]> {
    const projectId = authenticationSession.getProjectId()!;
    return api.get<KnowledgeBaseFile[]>('/v1/knowledge-base/files', {
      projectId,
    });
  },
  upload(formData: FormData): Promise<KnowledgeBaseFile> {
    const projectId = authenticationSession.getProjectId()!;
    return api.any<KnowledgeBaseFile>(
      `/v1/knowledge-base/files/upload?projectId=${encodeURIComponent(projectId)}`,
      {
        method: 'POST',
        data: formData,
      },
    );
  },
};
