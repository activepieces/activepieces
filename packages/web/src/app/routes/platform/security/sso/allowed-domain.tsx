import { PlatformWithoutSensitiveData } from '@activepieces/shared';
import { t } from 'i18next';
import { toast } from 'sonner';

import { Panel } from '@/components/custom/panel';
import { ChipListField } from '@/components/custom/settings-parts';
import { ssoMutations } from '@/features/platform-admin';
import { userHooks } from '@/hooks/user-hooks';
import { AdminControl } from '@/lib/admin-control';

export const AllowedDomainsPanel = ({ platform }: AllowedDomainsPanelProps) => {
  const domains = platform.allowedAuthDomains ?? [];
  const { mutate, mutateAsync } = ssoMutations.useAllowedDomains();
  const { data: currentUser } = userHooks.useCurrentUser();
  const ownDomain = currentUser?.email
    ? normalizeDomain(currentUser.email.split('@')[1] ?? '')
    : null;

  return (
    <Panel
      title={t('Allowed email domains')}
      description={t(
        'Only addresses on these domains can sign up, sign in or be invited. Empty means anyone.',
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
          if (!value.includes('.')) {
            return t('Enter a domain such as example.com');
          }
          if (
            domains.length === 0 &&
            ownDomain &&
            normalizeDomain(value) !== ownDomain
          ) {
            return t(
              'Add your own domain, {domain}, first so you can still sign in.',
              { domain: ownDomain },
            );
          }
          return null;
        }}
        onAdd={(value) =>
          mutateAsync({ type: 'add', value: normalizeDomain(value) })
        }
        onRemove={(value) => {
          if (domains.length > 1 && normalizeDomain(value) === ownDomain) {
            toast.error(t("Can't remove your own domain yet"), {
              description: t(
                'Remove the other domains first. Otherwise you can no longer sign in.',
              ),
            });
            return;
          }
          mutate({ type: 'remove', value });
        }}
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
