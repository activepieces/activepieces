import { Platform, SsoDomainVerification } from '@activepieces/shared';

import { api } from '@/lib/api';

export const samlSsoApi = {
  updateSsoDomain(ssoDomain: string | null) {
    return api.post<Platform>('/v1/authn/saml/sso-domain', { ssoDomain });
  },
  verifySsoDomain() {
    return api.post<{
      ssoDomain: string | null;
      ssoDomainVerification: SsoDomainVerification | null;
    }>('/v1/authn/saml/sso-domain/verify', {});
  },
};
