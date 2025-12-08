import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { CheckCircle, ExternalLink, ShieldAlertIcon } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';
import semver from 'semver';

import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
import { Button } from '@/components/ui/button';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item';
import { LoadingSpinner } from '@/components/ui/spinner';
import { aiProviderApi } from '@/features/platform-admin/lib/ai-provider-api';
import { flagsHooks } from '@/hooks/flags-hooks';
import { healthApi } from '@/lib/health-api';
import { platformUserApi } from '@/lib/platform-user-api';
import { ApFlagId } from '@activepieces/shared';

export default function WorkersPage() {
  const { data: currentVersion } = flagsHooks.useFlag<string>(
    ApFlagId.CURRENT_VERSION,
  );
  const { data: latestVersion } = flagsHooks.useFlag<string>(
    ApFlagId.LATEST_VERSION,
  );
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

  const technicalChecks = [
    {
      id: 'version',
      check: 'Version Check',
      isHealthy: isVersionUpToDate,
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
      check: 'Disk Size',
      isHealthy: systemHealth?.disk,
      message: systemHealth?.disk
        ? 'Minimum amount of disk space is available'
        : 'Minimum 10GB of disk space is required',
      loading: isPending,
    },
    {
      id: 'ram',
      check: 'RAM',
      isHealthy: systemHealth?.ram,
      message: systemHealth?.ram
        ? 'Minimum amount of RAM is available'
        : 'Minimum 4GB of RAM is required',
      link: 'https://www.activepieces.com/docs/install/configuration/hardware#technical-specifications',
      loading: isPending,
    },
    {
      id: 'cpu',
      check: 'CPU Cores',
      isHealthy: systemHealth?.cpu,
      message: systemHealth?.cpu
        ? 'Minimum amount of CPU cores is available'
        : 'Minimum 1 CPU core is required',
      link: 'https://www.activepieces.com/docs/install/configuration/hardware#technical-specifications',
      loading: isPending,
    },
    {
      id: 'smtp-config',
      check: 'SMTP Configuration',
      isHealthy: systemHealth?.smtp,
      message: systemHealth?.smtp
        ? 'SMTP Configuration is correct'
        : 'SMTP Configuration is incorrect',
      link: 'https://www.activepieces.com/docs/install/configuration/environment-variables#environment-variables',
      loading: isPending,
    },
  ];

  const hasConfiguredAiProvider = !!aiProviders?.some(
    (provider) => provider.configured,
  );
  const hasInvitedUsers = users?.data && users.data.length > 1;

  const onBoardingChecks = [
    {
      id: 'ai-provider',
      check: 'AI Provider',
      isDone: hasConfiguredAiProvider,
      message: hasConfiguredAiProvider
        ? 'AI Provider is configured'
        : 'Setup at least one AI provider',
      loading: isAiProvidersPending,
      action: {
        label: t('Setup'),
        link: '/platform/setup/ai',
      },
    },
    {
      id: 'invite-user',
      check: 'Invite User',
      isDone: hasInvitedUsers,
      message: hasInvitedUsers
        ? 'User invited'
        : 'Invite at least one user to your platform',
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
        <Item variant="outline" key={check.id}>
          <ItemMedia variant="icon">
            {check.loading ? (
              <LoadingSpinner />
            ) : check.isHealthy ? (
              <CheckCircle className="text-green-700" size={16} />
            ) : (
              <ShieldAlertIcon className="text-destructive-300" size={16} />
            )}
          </ItemMedia>
          <ItemContent>
            <ItemTitle>{check.check}</ItemTitle>
            <ItemDescription>
              <div
                dangerouslySetInnerHTML={{
                  __html: check.loading ? '...' : check.message,
                }}
              />
            </ItemDescription>
          </ItemContent>
          {check.link && (
            <ItemActions>
              <a href={check.link} target="_blank" rel="noreferrer">
                <Button variant="outline" size="xs" asChild>
                  <ExternalLink size={18} />
                </Button>
              </a>
            </ItemActions>
          )}
        </Item>
      ))}
      <h1 className="text-2xl font-semibold">{t('On-Boarding Checks')}</h1>
      {onBoardingChecks.map((check) => (
        <Item variant="outline" key={check.id}>
          <ItemMedia variant="icon">
            {check.loading ? (
              <LoadingSpinner />
            ) : check.isDone ? (
              <CheckCircle className="text-green-700" size={16} />
            ) : (
              <ShieldAlertIcon className="text-destructive-300" size={16} />
            )}
          </ItemMedia>
          <ItemContent>
            <ItemTitle>{check.check}</ItemTitle>
            <ItemDescription>
              <div
                dangerouslySetInnerHTML={{
                  __html: check.loading ? '...' : check.message,
                }}
              />
            </ItemDescription>
          </ItemContent>
          {check.action && !check.isDone && (
            <ItemActions>
              <Button variant="outline-primary" size="default">
                <Link to={check.action.link}>{check.action.label}</Link>
              </Button>
            </ItemActions>
          )}
        </Item>
      ))}
    </div>
  );
}
