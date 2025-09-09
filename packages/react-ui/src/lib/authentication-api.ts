import {
  ResetPasswordRequestBody,
  VerifyEmailRequestBody,
} from '@activepieces/ee-shared';
import {
  AuthenticationResponse,
  ClaimTokenRequest,
  FederatedAuthnLoginResponse,
  ProjectRole,
  SignInRequest,
  SignUpRequest,
  SwitchPlatformRequest,
  SwitchProjectRequest,
  ThirdPartyAuthnProviderEnum,
  UserIdentity,
} from '@activepieces/shared';

import { api } from '@/lib/api';

export const authenticationApi = {
  signIn(request: SignInRequest) {
    return api.post<AuthenticationResponse>(
      '/v1/authentication/sign-in',
      request,
    );
  },
  signUp(request: SignUpRequest) {
    return api.post<AuthenticationResponse>(
      '/v1/authentication/sign-up',
      request,
    );
  },
  getFederatedAuthLoginUrl(providerName: ThirdPartyAuthnProviderEnum) {
    return api.get<FederatedAuthnLoginResponse>(`/v1/authn/federated/login`, {
      providerName,
    });
  },
  getCurrentProjectRole() {
    return api.get<ProjectRole | null>('/v1/project-members/role');
  },
  claimThirdPartyRequest(request: ClaimTokenRequest) {
    return api.post<AuthenticationResponse>(
      '/v1/authn/federated/claim',
      request,
    );
  },
  resetPassword(request: ResetPasswordRequestBody) {
    return api.post<void>('/v1/authn/local/reset-password', request);
  },
  verifyEmail(request: VerifyEmailRequestBody) {
    return api.post<UserIdentity>('/v1/authn/local/verify-email', request);
  },
  switchProject(request: SwitchProjectRequest) {
    return api.post<AuthenticationResponse>(
      `/v1/authentication/switch-project`,
      request,
    );
  },
  switchPlatform(request: SwitchPlatformRequest) {
    return api.post<AuthenticationResponse>(
      `/v1/authentication/switch-platform`,
      request,
    );
  },
};
