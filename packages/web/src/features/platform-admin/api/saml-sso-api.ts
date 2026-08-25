import { SsoDomainVerification } from '@activepieces/shared';

import { api } from '@/lib/api';

type SsoDomainState = {
  ssoDomain: string | null;
  ssoDomainVerification: SsoDomainVerification | null;
};

export const samlSsoApi = {
  discover(domain: string) {
    return api.post<{ platformId: string | null }>('/v1/authn/saml/discover', {
      domain,
    });
  },
  updateSsoDomain(ssoDomain: string | null) {
    return api.post<SsoDomainState>('/v1/authn/saml/sso-domain', {
      ssoDomain,
    });
  },
  verifySsoDomain() {
    return api.post<SsoDomainState>('/v1/authn/saml/sso-domain/verify', {});
  },
};
