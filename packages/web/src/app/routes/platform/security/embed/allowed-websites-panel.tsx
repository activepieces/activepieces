import { allowedEmbedOriginSchema, ApFlagId } from '@activepieces/shared';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { toast } from 'sonner';

import { platformApi } from '@/api/platforms-api';
import { Panel } from '@/components/custom/panel';
import { ChipListField } from '@/components/custom/settings-parts';
import { Badge } from '@/components/ui/badge';
import { internalErrorToast } from '@/components/ui/sonner';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

export const AllowedWebsitesPanel = ({
  allowedEmbedOrigins,
}: AllowedWebsitesPanelProps) => {
  const { platform, refetch } = platformHooks.useCurrentPlatform();
  const { data: envAllowedOrigins } = flagsHooks.useFlag<string[]>(
    ApFlagId.ALLOWED_EMBED_ORIGINS,
  );

  const { mutate: saveOrigins, isPending } = useMutation({
    mutationFn: async (origins: string[]) => {
      await platformApi.update({ allowedEmbedOrigins: origins }, platform.id);
      await refetch();
    },
    onSuccess: () => {
      toast.success(t('Allowed websites updated'));
    },
    onError: () => internalErrorToast(),
  });

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
        disabled={isPending}
        placeholder="https://portal.example.com"
        emptyLabel={t('No websites allowed yet.')}
        validate={(value) =>
          allowedEmbedOriginSchema.safeParse(value).success
            ? null
            : t(
                'Needs http:// or https://, no path, and only a wildcard subdomain like https://*.example.com.',
              )
        }
        onAdd={(origin) => saveOrigins([...allowedEmbedOrigins, origin])}
        onRemove={(origin) =>
          saveOrigins(allowedEmbedOrigins.filter((item) => item !== origin))
        }
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
