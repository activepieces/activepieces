import {
  AuthenticationResponse,
  SignInRequest,
  SignUpRequest,
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
};
