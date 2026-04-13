import {
  CreateOtpRequestBody,
  EnableTotpResponse,
  ForcedSetupCompleteResponse,
  GetCurrentProjectMemberRoleQuery,
  InitMfaResponse,
  MfaChallengeResponse,
  ResetPasswordRequestBody,
  VerifyEmailRequestBody,
  AuthenticationResponse,
  ClaimTokenRequest,
  FederatedAuthnLoginResponse,
  ProjectRole,
  SignInRequest,
  SignUpRequest,
  SwitchPlatformRequest,
  ThirdPartyAuthnProviderEnum,
  UserIdentity,
  SetupTotpResponse,
  SignInResponse,
} from '@activepieces/shared';

import { api } from '@/lib/api';

export const authenticationApi = {
  signIn(request: SignInRequest) {
    return api.post<SignInResponse>('/v1/authentication/sign-in', request);
  },
  signUp(request: SignUpRequest) {
    return api.post<AuthenticationResponse | MfaChallengeResponse>(
      '/v1/authentication/sign-up',
      request,
    );
  },
  getFederatedAuthLoginUrl(providerName: ThirdPartyAuthnProviderEnum) {
    return api.get<FederatedAuthnLoginResponse>(`/v1/authn/federated/login`, {
      providerName,
    });
  },
  getCurrentProjectRole(query: GetCurrentProjectMemberRoleQuery) {
    return api.get<ProjectRole | null>('/v1/project-members/role', query);
  },
  claimThirdPartyRequest(request: ClaimTokenRequest) {
    return api.post<SignInResponse>('/v1/authn/federated/claim', request);
  },
  sendOtpEmail(request: CreateOtpRequestBody) {
    return api.post<void>('/v1/otp', request);
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
  initMfaSetup() {
    return api.post<InitMfaResponse>('/v1/authentication/2fa/init', {});
  },
  setup2fa({ mfaToken }: { mfaToken: string }) {
    return api.post<SetupTotpResponse>('/v1/authentication/2fa/setup', {
      mfaToken,
    });
  },
  enable2fa({ mfaToken, code }: { mfaToken: string; code: string }) {
    return api.post<ForcedSetupCompleteResponse | EnableTotpResponse>(
      '/v1/authentication/2fa/enable',
      { mfaToken, code },
    );
  },
  disable2fa({ code }: { code: string }) {
    return api.post<void>('/v1/authentication/2fa/disable', { code });
  },
  verify2fa({ mfaToken, code }: { mfaToken: string; code: string }) {
    return api.post<AuthenticationResponse>('/v1/authentication/2fa/verify', {
      mfaToken,
      code,
    });
  },
  get2faStatus() {
    return api.get<{ enabled: boolean; backupCodesRemaining: number }>(
      '/v1/authentication/2fa/status',
    );
  },
  regenerateBackupCodes({ code }: { code: string }) {
    return api.post<{ backupCodes: string[] }>(
      '/v1/authentication/2fa/backup-codes/regenerate',
      { code },
    );
  },
};
