import { allowedEmbedOriginSchema, ApFlagId } from '@activepieces/shared';
import { t } from 'i18next';

import { Panel } from '@/components/custom/panel';
import { ChipListField } from '@/components/custom/settings-parts';
import { Badge } from '@/components/ui/badge';
import { embedSubdomainMutations } from '@/features/platform-admin';
import { flagsHooks } from '@/hooks/flags-hooks';
import { AdminControl } from '@/lib/admin-control';

export const AllowedWebsitesPanel = ({
  allowedEmbedOrigins,
}: AllowedWebsitesPanelProps) => {
  const { data: envAllowedOrigins } = flagsHooks.useFlag<string[]>(
    ApFlagId.ALLOWED_EMBED_ORIGINS,
  );
  const { mutate, mutateAsync } = embedSubdomainMutations.useAllowedOrigins();

  return (
    <Panel
      title={t('Websites allowed to embed')}
      description={t(
        'Only these websites may load the embed in an iframe. Wildcard subdomains work; a path after the host does not.',
      )}
    >
      <ChipListField
        values={allowedEmbedOrigins}
        mono
        submitControl={AdminControl.EMBEDDING_ALLOWED_DOMAINS_SUBMIT}
        placeholder="https://portal.example.com"
        emptyLabel={t('No websites allowed yet.')}
        validate={(value) => {
          if (
            allowedEmbedOrigins.some(
              (origin) => origin.toLowerCase() === value.toLowerCase(),
            )
          ) {
            return t('Already in the list');
          }
          return allowedEmbedOriginSchema.safeParse(value.toLowerCase()).success
            ? null
            : t(
                'Needs http:// or https://, no path, and only a wildcard subdomain like https://*.example.com.',
              );
        }}
        onAdd={(origin) =>
          mutateAsync({ type: 'add', value: origin.toLowerCase() })
        }
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
    </Panel>
  );
};

type AllowedWebsitesPanelProps = {
  allowedEmbedOrigins: string[];
};
