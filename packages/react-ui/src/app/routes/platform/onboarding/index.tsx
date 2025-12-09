import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import React from 'react';
import semver from 'semver';

import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
import { aiProviderApi } from '@/features/platform-admin/lib/ai-provider-api';
import { flagsHooks } from '@/hooks/flags-hooks';
import { healthApi } from '@/lib/health-api';
import { platformUserApi } from '@/lib/platform-user-api';
import { formatUtils } from '@/lib/utils';
import { ApFlagId } from '@activepieces/shared';

import { CheckItem } from './check-item';

export default function OnboardingPage() {
  const { data: currentVersion } = flagsHooks.useFlag<string>(
    ApFlagId.CURRENT_VERSION,
  );
  const { data: latestVersion } = flagsHooks.useFlag<string>(
    ApFlagId.LATEST_VERSION,
  );
  const { data: supportedAppWebhooks } = flagsHooks.useFlag<string[]>(
    ApFlagId.SUPPORTED_APP_WEBHOOKS,
  );
  const { data: publicUrl } = flagsHooks.useFlag<string>(ApFlagId.PUBLIC_URL);
  const { data: systemHealth, isPending } = useQuery({
    queryKey: ['system-health'],
    queryFn: () => healthApi.getSystemHealthChecks(),
  });

  const { data: aiProviders, isPending: isAiProvidersPending } = useQuery({
    queryKey: ['ai-providers'],
    queryFn: () => aiProviderApi.list(),
  });

  const { data: users, isPending: isUsersPending } = useQuery({
    queryKey: ['users'],
    queryFn: () => platformUserApi.list({ limit: 1 }),
  });

  const isVersionUpToDate = React.useMemo(() => {
    if (!currentVersion || !latestVersion) return false;
    return semver.gte(currentVersion, latestVersion);
  }, [currentVersion, latestVersion]);

  const slackSecretConfigured = React.useMemo(
    () => supportedAppWebhooks?.includes('@activepieces/piece-slack'),
    [supportedAppWebhooks],
  );

  const httpsPublicUrl = React.useMemo(
    () => !!publicUrl && formatUtils.urlIsNotLocalhostOrIp(publicUrl),
    [publicUrl],
  );

  const hasConfiguredAiProvider = React.useMemo(
    () => !!aiProviders?.some((provider) => provider.configured),
    [aiProviders],
  );

  const hasInvitedUsers = React.useMemo(
    () => users?.data && users.data.length > 1,
    [users],
  );

  const technicalChecks = [
    {
      id: 'version',
      title: t('Version Check'),
      isChecked: isVersionUpToDate,
      message: `<b>Current</b>: ${
        currentVersion || 'Unknown'
      }\n<b>Latest</b>: ${latestVersion || 'Unknown'}\n${
        !isVersionUpToDate
          ? 'Upgrade now to enjoy the latest features and bug fixes.\nCheck the changelog <a class="font-medium text-blue-600 dark:text-blue-500 hover:underline" href="https://github.com/activepieces/activepieces/releases" target="_blank">releases</a>.'
          : ''
      }`,
      link: 'https://github.com/activepieces/activepieces/releases',
    },
    {
      id: 'disk-size',
      title: t('Disk Size'),
      isChecked: systemHealth?.disk,
      message: systemHealth?.disk
        ? t('Minimum amount of disk space is available')
        : t('Minimum 30GB of disk space is required'),
      loading: isPending,
    },
    {
      id: 'ram',
      title: t('RAM'),
      isChecked: systemHealth?.ram,
      message: systemHealth?.ram
        ? t('Minimum amount of RAM is available')
        : t('Minimum 4GB of RAM is required'),
      link: 'https://www.activepieces.com/docs/install/configuration/hardware#technical-specifications',
      loading: isPending,
    },
    {
      id: 'cpu',
      title: t('CPU Cores'),
      isChecked: systemHealth?.cpu,
      message: systemHealth?.cpu
        ? t('Minimum amount of CPU cores is available')
        : t('Minimum 1 CPU core is required'),
      link: 'https://www.activepieces.com/docs/install/configuration/hardware#technical-specifications',
      loading: isPending,
    },
    {
      id: 'smtp-config',
      title: t('SMTP Configuration'),
      isChecked: systemHealth?.smtp,
      message: systemHealth?.smtp
        ? t('SMTP Configuration is correct')
        : t('SMTP Configuration is incorrect'),
      link: 'https://www.activepieces.com/docs/install/configuration/environment-variables#environment-variables',
      loading: isPending,
    },
    {
      id: 'https-public-url',
      title: t('HTTPS Public URL'),
      isChecked: httpsPublicUrl,
      message: httpsPublicUrl
        ? t('HTTPS Public URL is configured')
        : t('HTTPS Public URL is not configured'),
      loading: isPending,
      link: 'https://www.activepieces.com/docs/install/configuration/environment-variables#environment-variables',
    },
    {
      id: 'slack-secret-configured',
      title: t('Slack Secret Configured'),
      isChecked: slackSecretConfigured,
      message: slackSecretConfigured
        ? t('Slack Secret is configured')
        : t('Slack Secret is not configured'),
      loading: isPending,
      link: 'https://www.activepieces.com/docs/install/configuration/setup-app-webhooks#slack',
    },
  ];

  const onBoardingChecks = [
    {
      id: 'ai-provider',
      title: t('AI Provider'),
      isChecked: hasConfiguredAiProvider,
      message: hasConfiguredAiProvider
        ? t('AI Provider is configured')
        : t('Setup at least one AI provider'),
      loading: isAiProvidersPending,
      action: {
        label: t('Setup'),
        link: '/platform/setup/ai',
      },
    },
    {
      id: 'invite-user',
      title: t('Invite User'),
      isChecked: hasInvitedUsers,
      message: hasInvitedUsers
        ? t('User invited')
        : t('Invite at least one user to your platform'),
      loading: isUsersPending,
      action: {
        label: t('Invite'),
        link: '/platform/users',
      },
    },
  ];

  return (
    <div className="flex flex-col w-full gap-4">
      <DashboardPageHeader
        title={t('System Health Status')}
        description={t('Check the status of your platform and its components')}
      />
      <h1 className="text-2xl font-semibold">{t('Technical Checks')}</h1>
      {technicalChecks.map((check) => (
        <CheckItem
          key={check.id}
          id={check.id}
          title={check.title}
          isChecked={check.isChecked ?? false}
          message={check.message}
          loading={check.loading ?? false}
          link={check.link}
        />
      ))}
      <h1 className="text-2xl font-semibold">{t('On-Boarding Checks')}</h1>
      {onBoardingChecks.map((check) => (
        <CheckItem
          key={check.id}
          id={check.id}
          title={check.title}
          isChecked={check.isChecked ?? false}
          message={check.message}
          loading={check.loading ?? false}
          action={check.action ?? undefined}
        />
      ))}
    </div>
  );
}
