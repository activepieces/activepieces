import { ResetPasswordRequestBody } from '@activepieces/ee-shared';
import {
  AuthenticationResponse,
  ClaimTokenRequest,
  FederatedAuthnLoginResponse,
  SignInRequest,
  ThirdPartyAuthnProviderEnum,
} from '@activepieces/shared';

import { api } from '@/lib/api';

export const authenticationApi = {
  signIn(request: SignInRequest) {
    return api.post<AuthenticationResponse>(
      '/v1/authentication/sign-in',
      request
    );
  },
  getFederatedAuthLoginUrl(providerName: ThirdPartyAuthnProviderEnum) {
    return api.get<FederatedAuthnLoginResponse>(`/v1/authn/federated/login`, {
      providerName,
    });
  },
  claimThirdPartyRequest(request: ClaimTokenRequest) {
    return api.post<AuthenticationResponse>(
      '/v1/authn/federated/claim',
      request
    );
  },
  resetPassword(request: ResetPasswordRequestBody) {
    return api.post<void>('/v1/authentication/reset-password', request);
  },
};
