import { ErrorCode } from '@activepieces/core-utils';
import { EmailDomain, SsoDomainVerificationStatus } from '@activepieces/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { toast } from 'sonner';

import { platformHooks } from '@/hooks/platform-hooks';
import { api } from '@/lib/api';

import { emailDomainApi } from '../api/email-domain-api';

export const emailDomainKeys = {
  all: ['email-domains'] as const,
};

export const emailDomainQueries = {
  useEmailDomains: () => {
    const { platform } = platformHooks.useCurrentPlatform();
    return useQuery({
      queryKey: emailDomainKeys.all,
      queryFn: () => emailDomainApi.list(),
      enabled: platform.plan.ssoEnabled,
    });
  },
  useVerifiedDomains: (): string[] => {
    const { data } = emailDomainQueries.useEmailDomains();
    return (data ?? [])
      .filter(
        (emailDomain) =>
          emailDomain.verificationStatus ===
          SsoDomainVerificationStatus.VERIFIED,
      )
      .map((emailDomain) => emailDomain.domain);
  },
};

export const emailDomainMutations = {
  useAddEmailDomain: ({
    onAdded,
    onLocked,
  }: {
    onAdded: (emailDomain: EmailDomain) => void;
    onLocked: () => void;
  }) => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (domain: string) => emailDomainApi.add({ domain }),
      onSuccess: async (emailDomain) => {
        await queryClient.invalidateQueries({ queryKey: emailDomainKeys.all });
        onAdded(emailDomain);
      },
      onError: async (error) => {
        if (api.isApError(error, ErrorCode.FEATURE_DISABLED)) {
          await queryClient.invalidateQueries({
            queryKey: emailDomainKeys.all,
          });
          onLocked();
        }
      },
    });
  },
  useVerifyEmailDomain: ({
    refetchPlatform,
    onVerified,
    onLocked,
  }: {
    refetchPlatform: () => Promise<void>;
    onVerified?: () => void;
    onLocked: () => void;
  }) => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => emailDomainApi.verify(id),
      onSuccess: async (emailDomain) => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: emailDomainKeys.all }),
          refetchPlatform(),
        ]);
        if (
          emailDomain.verificationStatus ===
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
      onError: async (error) => {
        if (api.isApError(error, ErrorCode.FEATURE_DISABLED)) {
          await queryClient.invalidateQueries({
            queryKey: emailDomainKeys.all,
          });
          onLocked();
          return;
        }
        toast.error(
          api.extractServerErrorMessage(error, t("Couldn't verify domain")),
        );
      },
    });
  },
  useRemoveEmailDomain: ({
    refetchPlatform,
  }: {
    refetchPlatform: () => Promise<void>;
  }) => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => emailDomainApi.remove(id),
      onSettled: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: emailDomainKeys.all }),
          refetchPlatform(),
        ]);
      },
    });
  },
};
