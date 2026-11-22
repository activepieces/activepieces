import { api } from '@/lib/api';

export const samlSsoApi = {
  discover(domain: string) {
    return api.post<{ platformId: string | null }>('/v1/authn/saml/discover', {
      domain,
    });
  },
};
