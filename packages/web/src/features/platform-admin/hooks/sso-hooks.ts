import { PlatformWithoutSensitiveData } from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';

import { platformApi } from '@/api/platforms-api';
import { useOptimisticMutation } from '@/hooks/use-optimistic-mutation';
import { authenticationSession } from '@/lib/authentication-session';

function platformQueryKey() {
  return ['platform', authenticationSession.getPlatformId()];
}

function useToggleSignInMethod() {
  const queryKey = platformQueryKey();
  return useOptimisticMutation<
    SignInToggle,
    PlatformWithoutSensitiveData,
    PlatformWithoutSensitiveData
  >({
    queryKey,
    scope: 'platform-sign-in-methods',
    mutationFn: ({ method, enabled }) =>
      platformApi.update(
        { [SIGN_IN_FIELD[method]]: enabled },
        authenticationSession.getPlatformId()!,
      ),
    apply: ({ current, vars }) => ({
      ...current,
      [SIGN_IN_FIELD[vars.method]]: vars.enabled,
    }),
    success: ({ vars }) => signInToggledMessage(vars),
    undo: ({ vars }) => ({ method: vars.method, enabled: !vars.enabled }),
    errorTitle: t("Couldn't update sign-in methods"),
  });
}

function useAllowedDomains() {
  const queryClient = useQueryClient();
  const queryKey = platformQueryKey();
  return useOptimisticMutation<
    ListChange,
    PlatformWithoutSensitiveData,
    PlatformWithoutSensitiveData
  >({
    queryKey,
    scope: 'platform-allowed-domains',
    mutationFn: (change) => {
      const latest = applyListChange({
        list:
          queryClient.getQueryData<PlatformWithoutSensitiveData>(queryKey)
            ?.allowedAuthDomains ?? [],
        change,
      });
      return platformApi.update(
        {
          allowedAuthDomains: latest,
          enforceAllowedAuthDomains: latest.length > 0,
        },
        authenticationSession.getPlatformId()!,
      );
    },
    apply: ({ current, vars }) => {
      const next = applyListChange({
        list: current.allowedAuthDomains ?? [],
        change: vars,
      });
      return {
        ...current,
        allowedAuthDomains: next,
        enforceAllowedAuthDomains: next.length > 0,
      };
    },
    success: ({ vars }) =>
      vars.type === 'add'
        ? t('{value} added', { value: vars.value })
        : t('{value} removed', { value: vars.value }),
    undo: ({ vars }) => invertListChange(vars),
    errorTitle: t("Couldn't update allowed domains"),
  });
}

function applyListChange({
  list,
  change,
}: {
  list: string[];
  change: ListChange;
}): string[] {
  if (change.type === 'add') {
    return list.includes(change.value) ? list : [...list, change.value];
  }
  return list.filter((item) => item !== change.value);
}

function invertListChange(change: ListChange): ListChange {
  return {
    type: change.type === 'add' ? 'remove' : 'add',
    value: change.value,
  };
}

function signInToggledMessage({ method, enabled }: SignInToggle): string {
  if (method === 'email') {
    return enabled
      ? t('Email and password sign-in turned on')
      : t('Email and password sign-in turned off');
  }
  return enabled
    ? t('Google sign-in turned on')
    : t('Google sign-in turned off');
}

const SIGN_IN_FIELD = {
  email: 'emailAuthEnabled',
  google: 'googleAuthEnabled',
} as const;

export const ssoMutations = {
  useToggleSignInMethod,
  useAllowedDomains,
};

export const platformListChange = {
  apply: applyListChange,
  invert: invertListChange,
};

export type SignInToggle = {
  method: keyof typeof SIGN_IN_FIELD;
  enabled: boolean;
};

export type ListChange = {
  type: 'add' | 'remove';
  value: string;
};
