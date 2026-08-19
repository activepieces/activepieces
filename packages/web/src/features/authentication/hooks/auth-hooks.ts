import {
  AuthenticationResponse,
  CompleteSignUpRequest,
  CreateOtpRequestBody,
  RequestEmailCodeRequest,
  ResetPasswordRequestBody,
  SignInRequest,
  SignUpRequest,
  UserIdentity,
  VerifyEmailRequestBody,
  VerifyEmailCodeRequest,
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
  useRequestEmailCode: ({
    onSuccess,
    onError,
  }: {
    onSuccess: () => void;
    onError: (error: HttpError) => void;
  }) => {
    return useMutation<void, HttpError, RequestEmailCodeRequest>({
      mutationFn: authenticationApi.requestEmailCode,
      onSuccess,
      onError,
    });
  },
  useCompleteSignUp: ({
    onSuccess,
    onError,
  }: {
    onSuccess: (data: AuthenticationResponse) => void;
    onError: (error: HttpError) => void;
  }) => {
    return useMutation<
      AuthenticationResponse,
      HttpError,
      CompleteSignUpRequest
    >({
      mutationFn: authenticationApi.completeSignUp,
      onSuccess,
      onError,
    });
  },
  useVerifyEmailCode: ({
    onSuccess,
    onError,
  }: {
    onSuccess: (data: AuthenticationResponse) => void;
    onError: (error: HttpError) => void;
  }) => {
    return useMutation<
      AuthenticationResponse,
      HttpError,
      VerifyEmailCodeRequest
    >({
      mutationFn: authenticationApi.verifyEmailCode,
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
