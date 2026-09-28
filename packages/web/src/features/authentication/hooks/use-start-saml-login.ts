import { isNil } from '@activepieces/core-utils';
import { useSearchParams } from 'react-router-dom';

import { federatedLoginRedirect } from '@/lib/federated-login-redirect';
import { FROM_QUERY_PARAM } from '@/lib/navigation-utils';

export function useStartSamlLogin() {
  const [searchParams] = useSearchParams();
  return ({ platformId }: StartSamlLoginParams = {}) => {
    federatedLoginRedirect.save(searchParams.get(FROM_QUERY_PARAM));
    window.location.href = isNil(platformId)
      ? SAML_LOGIN_PATH
      : `${SAML_LOGIN_PATH}?platformId=${encodeURIComponent(platformId)}`;
  };
}

const SAML_LOGIN_PATH = '/api/v1/authn/saml/login';

type StartSamlLoginParams = {
  platformId?: string;
};
