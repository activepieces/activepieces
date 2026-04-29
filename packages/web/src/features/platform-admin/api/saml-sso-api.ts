import { PlatformPlan } from '@activepieces/shared';

import { api } from '@/lib/api';

export const samlSsoApi = {
  discover(domain: string) {
    return api.post<{ platformId: string | null }>('/v1/authn/saml/discover', {
      domain,
    });
  },
  updateSsoDomain(ssoDomain: string | null) {
    return api.post<PlatformPlan>('/v1/authn/saml/sso-domain', { ssoDomain });
  },
};
