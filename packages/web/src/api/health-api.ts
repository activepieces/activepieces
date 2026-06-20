import {
  GetSecurityAdvisoriesResponse,
  GetSystemHealthChecksResponse,
} from '@activepieces/shared';

import { api } from '@/lib/api';

export const healthApi = {
  getSystemHealthChecks(): Promise<GetSystemHealthChecksResponse> {
    return api.get<GetSystemHealthChecksResponse>('/v1/health/system');
  },
  getSecurityAdvisories(): Promise<GetSecurityAdvisoriesResponse> {
    return api.get<GetSecurityAdvisoriesResponse>('/v1/security-advisories');
  },
};
