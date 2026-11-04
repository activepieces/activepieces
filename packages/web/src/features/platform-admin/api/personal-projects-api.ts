import { PersonalProjectsSummary } from '@activepieces/shared';

import { api } from '@/lib/api';

export const personalProjectsApi = {
  summary() {
    return api.get<PersonalProjectsSummary>('/v1/personal-projects/summary');
  },
  createMissing() {
    return api.post<void>('/v1/personal-projects/create-missing');
  },
};
