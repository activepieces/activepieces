import {
  AuthenticationResponse,
  CreateOtpRequestBody,
  ResetPasswordRequestBody,
  SignInRequest,
  SignUpRequest,
  UserIdentity,
  VerifyEmailRequestBody,
} from '@activepieces/shared';
import { useMutation } from '@tanstack/react-query';

import { authenticationApi } from '@/api/authentication-api';
import { HttpError } from '@/lib/api';

export const authMutations = {
  useSignIn: ({
    onSuccess,
    onError,
  }: {
    onSuccess: (data: AuthenticationResponse) => void;
    onError: (error: HttpError) => void;
  }) => {
    return useMutation<AuthenticationResponse, HttpError, SignInRequest>({
      mutationFn: authenticationApi.signIn,
      onSuccess,
      onError,
    });
  },
  useSignUp: ({
    onSuccess,
    onError,
  }: {
    onSuccess: (data: AuthenticationResponse) => void;
    onError: (error: HttpError) => void;
  }) => {
    return useMutation<AuthenticationResponse, HttpError, SignUpRequest>({
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
};
