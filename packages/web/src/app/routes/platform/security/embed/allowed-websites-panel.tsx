import { allowedEmbedOriginSchema, ApFlagId } from '@activepieces/shared';
import { t } from 'i18next';

import { ChipListField } from '@/components/custom/settings-parts';
import { Badge } from '@/components/ui/badge';
import { PLATFORM_FEATURES, PlanLockedPanel } from '@/features/billing';
import { embedSubdomainMutations } from '@/features/platform-admin';
import { flagsHooks } from '@/hooks/flags-hooks';
import { AdminControl } from '@/lib/admin-control';

export const AllowedWebsitesPanel = ({
  allowedEmbedOrigins,
  locked,
  showLockBanner,
}: AllowedWebsitesPanelProps) => {
  const { data: envAllowedOrigins } = flagsHooks.useFlag<string[]>(
    ApFlagId.ALLOWED_EMBED_ORIGINS,
  );
  const { mutate, mutateAsync } = embedSubdomainMutations.useAllowedOrigins();

  return (
    <PlanLockedPanel
      feature={PLATFORM_FEATURES.embedding}
      locked={locked}
      whenLocked={showLockBanner ? 'preview' : 'try'}
      title={t('Websites allowed to embed')}
      description={t(
        'Only these websites may load the embed in an iframe. Wildcard subdomains work; a path after the host does not.',
      )}
    >
      <ChipListField
        values={allowedEmbedOrigins}
        mono
        disabled={locked}
        submitControl={AdminControl.EMBEDDING_ALLOWED_DOMAINS_SUBMIT}
        placeholder="https://portal.example.com"
        emptyLabel={t('No websites allowed yet.')}
        validate={(value) =>
          allowedEmbedOriginSchema.safeParse(value).success
            ? null
            : t(
                'Needs http:// or https://, no path, and only a wildcard subdomain like https://*.example.com.',
              )
        }
        onAdd={(origin) => mutateAsync({ type: 'add', value: origin })}
        onRemove={(origin) => mutate({ type: 'remove', value: origin })}
      />
      {envAllowedOrigins && envAllowedOrigins.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-11">
          {t('Also allowed by the server configuration:')}
          {envAllowedOrigins.map((origin) => (
            <Badge key={origin} variant="secondary" className="font-mono">
              {origin}
            </Badge>
          ))}
        </div>
      )}
    </PlanLockedPanel>
  );
};

type AllowedWebsitesPanelProps = {
  allowedEmbedOrigins: string[];
  locked: boolean;
  showLockBanner: boolean;
};
