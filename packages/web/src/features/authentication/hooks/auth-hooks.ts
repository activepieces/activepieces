import {
  AuthenticationResponse,
  CreateOtpRequestBody,
  EnableTotpResponse,
  ForcedSetupCompleteResponse,
  InitMfaResponse,
  MfaChallengeResponse,
  ResetPasswordRequestBody,
  SetupTotpResponse,
  SignInRequest,
  SignInResponse,
  SignUpRequest,
  UserIdentity,
  VerifyEmailRequestBody,
} from '@activepieces/shared';
import { useMutation, useQuery } from '@tanstack/react-query';

import { authenticationApi } from '@/api/authentication-api';
import { HttpError } from '@/lib/api';

export const authMutations = {
  useSignIn: ({
    onSuccess,
    onError,
  }: {
    onSuccess: (data: SignInResponse) => void;
    onError: (error: HttpError) => void;
  }) => {
    return useMutation<SignInResponse, HttpError, SignInRequest>({
      mutationFn: authenticationApi.signIn,
      onSuccess,
      onError,
    });
  },
  useSignUp: ({
    onSuccess,
    onError,
  }: {
    onSuccess: (data: AuthenticationResponse | MfaChallengeResponse) => void;
    onError: (error: HttpError) => void;
  }) => {
    return useMutation<
      AuthenticationResponse | MfaChallengeResponse,
      HttpError,
      SignUpRequest
    >({
      mutationFn: authenticationApi.signUp,
      onSuccess,
      onError,
    });
  },
  useSendOtpEmail: ({ onSuccess }: { onSuccess?: () => void }) => {
    return useMutation<void, HttpError, CreateOtpRequestBody>({
      mutationFn: authenticationApi.sendOtpEmail,
      onSuccess,
    });
  },
  useResetPassword: ({
    onSuccess,
    onError,
  }: {
    onSuccess: () => void;
    onError: (error: HttpError) => void;
  }) => {
    return useMutation<void, HttpError, ResetPasswordRequestBody>({
      mutationFn: authenticationApi.resetPassword,
      onSuccess,
      onError,
    });
  },
  useVerifyEmail: ({
    onSuccess,
    onError,
  }: {
    onSuccess: (data: UserIdentity) => void;
    onError: (error: unknown) => void;
  }) => {
    return useMutation({
      mutationFn: (request: VerifyEmailRequestBody) =>
        authenticationApi.verifyEmail(request),
      onSuccess,
      onError,
    });
  },
  useVerify2fa: ({
    onSuccess,
    onError,
  }: {
    onSuccess: (data: AuthenticationResponse) => void;
    onError: (error: HttpError) => void;
  }) => {
    return useMutation<
      AuthenticationResponse,
      HttpError,
      { mfaToken: string; code: string }
    >({
      mutationFn: authenticationApi.verify2fa,
      onSuccess,
      onError,
    });
  },
  useEnable2fa: ({
    onSuccess,
    onError,
  }: {
    onSuccess: (data: ForcedSetupCompleteResponse | EnableTotpResponse) => void;
    onError: (error: HttpError) => void;
  }) => {
    return useMutation<
      ForcedSetupCompleteResponse | EnableTotpResponse,
      HttpError,
      { mfaToken: string; code: string }
    >({
      mutationFn: authenticationApi.enable2fa,
      onSuccess,
      onError,
    });
  },
};

export const authQueries = {
  use2faStatus: () => {
    return useQuery({
      queryKey: ['2fa-status'],
      queryFn: () => authenticationApi.get2faStatus(),
    });
  },
  useInitMfaSetup: () => {
    return useQuery<InitMfaResponse>({
      queryKey: ['2fa-init'],
      queryFn: () => authenticationApi.initMfaSetup(),
      refetchOnWindowFocus: false,
      staleTime: Infinity,
    });
  },
  useSetup2fa: ({ mfaToken }: { mfaToken: string | undefined }) => {
    return useQuery<SetupTotpResponse>({
      queryKey: ['2fa-setup', mfaToken],
      queryFn: () => authenticationApi.setup2fa({ mfaToken: mfaToken! }),
      enabled: !isNilToken(mfaToken),
      refetchOnWindowFocus: false,
      staleTime: Infinity,
    });
  },
};

export const authUtils = {
  isMfaChallenge,
};

function isMfaChallenge(
  data: SignInResponse | (AuthenticationResponse | MfaChallengeResponse),
): data is MfaChallengeResponse {
  return 'mfaToken' in data;
}

function isNilToken(value: string | undefined): value is undefined {
  return value == null;
}
