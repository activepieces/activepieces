import {
  SsoDomainVerificationStatus,
  UpdatePlatformRequestBody,
} from '@activepieces/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { toast } from 'sonner';

import { platformApi } from '@/api/platforms-api';
import { flagsHooks } from '@/hooks/flags-hooks';
import { api } from '@/lib/api';

import { samlSsoApi } from '../api/saml-sso-api';

export const ssoMutations = {
  useUpdatePlatformSso: ({
    platformId,
    refetch,
    onSuccess,
  }: {
    platformId: string;
    refetch: () => Promise<void>;
    onSuccess?: () => void;
  }) => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (request: UpdatePlatformRequestBody) => {
        await platformApi.update(request, platformId);
        await Promise.all([
          refetch(),
          queryClient.invalidateQueries({ queryKey: flagsHooks.queryKey }),
        ]);
      },
      onSuccess: () => {
        if (onSuccess) {
          onSuccess();
        }
      },
    });
  },
  useVerifySsoDomain: ({
    refetch,
    onVerified,
  }: {
    refetch: () => Promise<void>;
    onVerified?: () => void;
  }) => {
    return useMutation({
      mutationFn: async () => {
        const result = await samlSsoApi.verifySsoDomain();
        await refetch();
        return result;
      },
      onSuccess: (result) => {
        if (
          result.ssoDomainVerification?.status ===
          SsoDomainVerificationStatus.VERIFIED
        ) {
          toast.success(t('Domain verified'));
          onVerified?.();
          return;
        }
        toast.message(
          t('TXT record not found yet — DNS can take a few minutes.'),
        );
      },
      onError: (error) => {
        toast.error(
          api.extractServerErrorMessage(error, t("Couldn't verify domain")),
        );
      },
    });
  },
};
