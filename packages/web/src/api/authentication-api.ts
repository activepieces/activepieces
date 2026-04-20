import {
  CreateOtpRequestBody,
  GetCurrentProjectMemberRoleQuery,
  ResetPasswordRequestBody,
  VerifyEmailRequestBody,
  AuthenticationResponse,
  MfaChallengeResponse,
  ProjectRole,
  SignInRequest,
  SignUpRequest,
  SwitchPlatformRequest,
  UserIdentity,
} from '@activepieces/shared';

import { api } from '@/lib/api';

export const authenticationApi = {
  signIn(request: SignInRequest) {
    return api.post<AuthenticationResponse | MfaChallengeResponse>(
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
  getCurrentProjectRole(query: GetCurrentProjectMemberRoleQuery) {
    return api.get<ProjectRole | null>('/v1/project-members/role', query);
  },
  sendOtpEmail(request: CreateOtpRequestBody) {
    return api.post<void>('/v1/authn/local/send-otp', request);
  },
  resetPassword(request: ResetPasswordRequestBody) {
    return api.post<void>('/v1/authn/local/reset-password', request);
  },
  verifyEmail(request: VerifyEmailRequestBody) {
    return api.post<UserIdentity>('/v1/authn/local/verify-email', request);
  },
  switchPlatform(request: SwitchPlatformRequest) {
    return api.post<AuthenticationResponse>(
      `/v1/authentication/switch-platform`,
      request,
    );
  },
  exchangeSession() {
    return api.post<AuthenticationResponse | MfaChallengeResponse>(
      '/v1/authentication/exchange-session',
      {},
    );
  },
  get2faStatus() {
    return api.get<{
      enabled: boolean;
      backupCodesRemaining: number;
      hasPassword: boolean;
    }>('/v1/authentication/2fa-status');
  },
  getFederatedProviderId({ providerName }: { providerName: string }) {
    return api.get<{ providerId: string | null }>(
      '/v1/authentication/federated-provider-id',
      { providerName },
    );
  },
};
