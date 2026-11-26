import { SsoDomainVerification } from '@activepieces/shared';

import { api } from '@/lib/api';

type DiscoverSamlRequest = {
  domain: string;
  captchaToken?: string;
};

type SsoDomainState = {
  ssoDomain: string | null;
  ssoDomainVerification: SsoDomainVerification | null;
};

export const samlSsoApi = {
  discover({ domain, captchaToken }: DiscoverSamlRequest) {
    return api.post<{ platformId: string | null }>('/v1/authn/saml/discover', {
      domain,
      captchaToken,
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
