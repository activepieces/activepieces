import { AuthenticationResponse, ErrorCode } from '@activepieces/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';

import { api, HttpError } from '@/lib/api';

import { twoFactorApi } from '../api/two-factor-api';

function extractErrorMessage(error: unknown): string {
  if (!api.isError(error)) return t('Something went wrong');
  const data = error.response?.data;
  if (!api.isApError(error, ErrorCode.AUTHENTICATION)) {
    return (data as { message: string }).message ?? t('Something went wrong');
  }
  return (data as { params: { message: string } }).params.message;
}

export const twoFactorMutations = {
  useEnable: ({
    onSuccess,
    onError,
  }: {
    onSuccess: (data: { totpURI: string; backupCodes: string[] }) => void;
    onError: (error: HttpError) => void;
  }) => {
    return useMutation<
      { totpURI: string; backupCodes: string[] },
      HttpError,
      { password?: string }
    >({
      mutationFn: twoFactorApi.enable,
      onSuccess,
      onError,
    });
  },
  useVerifyTotp: ({
    onSuccess,
    onError,
  }: {
    onSuccess: (data: AuthenticationResponse) => void;
    onError: (error: HttpError) => void;
  }) => {
    return useMutation<AuthenticationResponse, HttpError, { code: string }>({
      mutationFn: twoFactorApi.verifyTotp,
      onSuccess,
      onError,
    });
  },
  useVerifyBackupCode: ({
    onSuccess,
    onError,
  }: {
    onSuccess: (data: AuthenticationResponse) => void;
    onError: (error: HttpError) => void;
  }) => {
    return useMutation<AuthenticationResponse, HttpError, { code: string }>({
      mutationFn: twoFactorApi.verifyBackupCode,
      onSuccess,
      onError,
    });
  },
  useDisable: ({
    onSuccess,
    onError,
  }: {
    onSuccess: (data: { status: boolean }) => void;
    onError: (error: HttpError) => void;
  }) => {
    return useMutation<{ status: boolean }, HttpError, { password?: string }>({
      mutationFn: twoFactorApi.disable,
      onSuccess,
      onError,
    });
  },
  useGenerateBackupCodes: ({
    onSuccess,
    onError,
  }: {
    onSuccess: (data: { backupCodes: string[] }) => void;
    onError: (error: HttpError) => void;
  }) => {
    return useMutation<
      { backupCodes: string[] },
      HttpError,
      { password?: string }
    >({
      mutationFn: twoFactorApi.generateBackupCodes,
      onSuccess,
      onError,
    });
  },
};

export const twoFactorQueries = {
  useStatus: () => {
    return useQuery({
      queryKey: ['2fa-status'],
      queryFn: twoFactorApi.status,
    });
  },
};

export const twoFactorUtils = { extractErrorMessage };
