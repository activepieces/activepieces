import { api } from '@/lib/api';
import { ResetPasswordRequestBody } from '@activepieces/ee-shared';
import {
  AuthenticationResponse,
  FederatedAuthnLoginResponse,
  SignInRequest,
  ThirdPartyAuthnProviderEnum,
} from '@activepieces/shared';

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
  resetPassword(request: ResetPasswordRequestBody) {
    return api.post<void>('/v1/authentication/reset-password', request);
  },
};
