import { t } from 'i18next';

import { apiKeyQueries } from '@/features/platform-admin';
import { secretManagersHooks } from '@/features/secret-managers';
import { platformHooks } from '@/hooks/platform-hooks';

import {
  AdminOverview,
  OverviewCard,
  OverviewCards,
  OverviewRow,
  OverviewRowLink,
  OverviewRows,
  OverviewSection,
} from './overview-shell';

export function SecurityOverview() {
  const { platform } = platformHooks.useCurrentPlatform();
  const {
    data: apiKeys,
    isLoading: isLoadingKeys,
    isError: isKeysError,
  } = apiKeyQueries.useApiKeys();
  const {
    data: secretManagers,
    isLoading: isLoadingSecrets,
    isError: isSecretsError,
  } = secretManagersHooks.useListSecretManagerConnections({
    listForPlatform: true,
  });

  const keyCount = apiKeys?.data.length ?? 0;
  const secretCount = secretManagers?.length ?? 0;
  const domains = platform.allowedAuthDomains ?? [];
  const bothLoginsOn = platform.googleAuthEnabled && platform.emailAuthEnabled;

  return (
    <AdminOverview
      title={t('Security')}
      description={t(
        'Credentials, secrets, and the record of what happens on the platform.',
      )}
    >
      <OverviewCards>
        <OverviewCard
          to="/platform/security?tab=api-keys"
          title={t('API keys')}
          tier="team"
          value={platform.plan.apiKeysEnabled ? keyCount : t('Locked')}
          isLoading={isLoadingKeys}
          isError={isKeysError}
          errorEntity={t('API keys')}
          description={
            keyCount === 0 ? t('No keys issued') : t('Active platform keys')
          }
        />
        <OverviewCard
          to="/platform/security?tab=secrets"
          title={t('Secret managers')}
          tier="enterprise"
          value={
            platform.plan.secretManagersEnabled ? secretCount : t('Locked')
          }
          isLoading={isLoadingSecrets}
          isError={isSecretsError}
          errorEntity={t('secret managers')}
          description={
            secretCount === 0
              ? t('No external vault connected')
              : t('External vaults connected')
          }
        />
        <OverviewCard
          to="/platform/security?tab=audit"
          title={t('Audit logs')}
          tier="enterprise"
          value={platform.plan.auditLogEnabled ? t('On') : t('Locked')}
          description={t('Every user and system action, recorded')}
        />
        <OverviewCard
          to="/platform/security?tab=events"
          title={t('Event streaming')}
          tier="enterprise"
          value={platform.plan.eventStreamingEnabled ? t('On') : t('Locked')}
          description={t('Forward audit events to your own webhook')}
        />
      </OverviewCards>

      <OverviewSection
        title={t('Security checklist')}
        description={t('Recommendations based on your current configuration.')}
      >
        <OverviewRows>
          <OverviewRow
            tone={bothLoginsOn ? 'warn' : 'ok'}
            label={
              bothLoginsOn
                ? t('Email and password login is enabled alongside Google')
                : t('One sign-in method is enabled')
            }
          >
            <OverviewRowLink to="/platform/users?tab=sso">
              {t('Review sign-in')}
            </OverviewRowLink>
          </OverviewRow>
          <OverviewRow
            tone={domains.length > 0 ? 'ok' : 'warn'}
            label={
              domains.length > 0
                ? t(
                    'Sign-up restricted to {count, plural, =1 {# domain} other {# domains}}',
                    {
                      count: domains.length,
                    },
                  )
                : t('No allowed email domains set')
            }
          >
            <OverviewRowLink to="/platform/users?tab=sso">
              {t('Restrict domains')}
            </OverviewRowLink>
          </OverviewRow>
          <OverviewRow
            tone={keyCount === 0 ? 'ok' : 'warn'}
            label={
              keyCount === 0
                ? t('No API keys issued')
                : t(
                    '{count, plural, =1 {# API key is} other {# API keys are}} active',
                    { count: keyCount },
                  )
            }
          >
            {keyCount === 0 ? t('Nothing to rotate') : undefined}
          </OverviewRow>
          <OverviewRow
            tone={platform.plan.auditLogEnabled ? 'ok' : 'off'}
            label={
              platform.plan.auditLogEnabled
                ? t('Audit logging is recording')
                : t('Audit logging is not available on your plan')
            }
          >
            {platform.plan.auditLogEnabled ? undefined : (
              <OverviewRowLink to="/platform/security?tab=audit">
                {t('Upgrade')}
              </OverviewRowLink>
            )}
          </OverviewRow>
        </OverviewRows>
      </OverviewSection>
    </AdminOverview>
  );
}
