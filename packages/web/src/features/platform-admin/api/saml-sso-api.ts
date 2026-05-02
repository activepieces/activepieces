import {
  PlatformWithoutFederatedAuth,
  SsoDomainVerification,
} from '@activepieces/shared';

import { api } from '@/lib/api';

export const samlSsoApi = {
  discover(domain: string) {
    return api.post<{ platformId: string | null }>('/v1/authn/saml/discover', {
      domain,
    });
  },
  updateSsoDomain(ssoDomain: string | null) {
    return api.post<PlatformWithoutFederatedAuth>(
      '/v1/authn/saml/sso-domain',
      { ssoDomain },
    );
  },
  verifySsoDomain() {
    return api.post<{
      ssoDomain: string | null;
      ssoDomainVerification: SsoDomainVerification | null;
    }>('/v1/authn/saml/sso-domain/verify', {});
  },
};
