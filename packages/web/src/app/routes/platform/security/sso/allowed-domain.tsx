import { PlatformWithoutSensitiveData } from '@activepieces/shared';
import { t } from 'i18next';

import { ChipListField } from '@/components/custom/settings-parts';
import { PLATFORM_FEATURES, PlanLockedPanel } from '@/features/billing';
import { ssoMutations } from '@/features/platform-admin';
import { AdminControl } from '@/lib/admin-control';

export const AllowedDomainsPanel = ({
  platform,
  locked,
}: AllowedDomainsPanelProps) => {
  const domains = platform.allowedAuthDomains ?? [];
  const { mutate, mutateAsync } = ssoMutations.useAllowedDomains();

  return (
    <PlanLockedPanel
      feature={PLATFORM_FEATURES.sso}
      locked={locked}
      whenLocked="try"
      title={t('Allowed email domains')}
      description={t(
        'Only addresses on these domains can sign up or be invited. Empty means anyone.',
      )}
    >
      <ChipListField
        values={domains}
        placeholder="example.com"
        emptyLabel={t('No domains set. Anyone can sign up.')}
        disabled={locked}
        submitControl={AdminControl.SSO_ALLOWED_DOMAINS_SUBMIT}
        validate={(value) =>
          value.includes('.') ? null : t('Enter a domain such as example.com')
        }
        onAdd={(value) =>
          mutateAsync({ type: 'add', value: value.toLowerCase() })
        }
        onRemove={(value) => mutate({ type: 'remove', value })}
      />
    </PlanLockedPanel>
  );
};

type AllowedDomainsPanelProps = {
  platform: PlatformWithoutSensitiveData;
  locked: boolean;
};
