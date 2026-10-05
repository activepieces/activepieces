import { PlatformWithoutSensitiveData } from '@activepieces/shared';
import { t } from 'i18next';

import { Panel } from '@/components/custom/panel';
import { ChipListField } from '@/components/custom/settings-parts';
import { ssoMutations } from '@/features/platform-admin';
import { AdminControl } from '@/lib/admin-control';

export const AllowedDomainsPanel = ({ platform }: AllowedDomainsPanelProps) => {
  const domains = platform.allowedAuthDomains ?? [];
  const { mutate, mutateAsync } = ssoMutations.useAllowedDomains();

  return (
    <Panel
      title={t('Allowed email domains')}
      description={t(
        'Only addresses on these domains can sign up or be invited. Empty means anyone.',
      )}
    >
      <ChipListField
        values={domains}
        placeholder="example.com"
        emptyLabel={t('No domains set. Anyone can sign up.')}
        submitControl={AdminControl.SSO_ALLOWED_DOMAINS_SUBMIT}
        validate={(value) => {
          if (
            domains.some(
              (domain) => normalizeDomain(domain) === normalizeDomain(value),
            )
          ) {
            return t('Already in the list');
          }
          return value.includes('.')
            ? null
            : t('Enter a domain such as example.com');
        }}
        onAdd={(value) =>
          mutateAsync({ type: 'add', value: normalizeDomain(value) })
        }
        onRemove={(value) => mutate({ type: 'remove', value })}
      />
    </Panel>
  );
};

function normalizeDomain(value: string): string {
  return value.trim().toLowerCase();
}

type AllowedDomainsPanelProps = {
  platform: PlatformWithoutSensitiveData;
};
