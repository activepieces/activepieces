import { allowedEmbedOriginSchema, ApFlagId } from '@activepieces/shared';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { platformApi } from '@/api/platforms-api';
import { Panel } from '@/components/custom/panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { internalErrorToast } from '@/components/ui/sonner';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { cn } from '@/lib/utils';

export const AllowedWebsitesPanel = ({
  allowedEmbedOrigins,
}: AllowedWebsitesPanelProps) => {
  const { platform, refetch } = platformHooks.useCurrentPlatform();
  const { data: envAllowedOrigins } = flagsHooks.useFlag<string[]>(
    ApFlagId.ALLOWED_EMBED_ORIGINS,
  );
  const [draft, setDraft] = useState('');
  const candidate = draft.trim();
  const valid =
    candidate.length > 0 &&
    allowedEmbedOriginSchema.safeParse(candidate).success;
  const invalid = candidate.length > 0 && !valid;
  const duplicate = allowedEmbedOrigins.includes(candidate);

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

  const add = () => {
    if (!valid || duplicate || isPending) return;
    setDraft('');
    saveOrigins([...allowedEmbedOrigins, candidate], {
      onError: () => setDraft(candidate),
    });
  };

  return (
    <Panel
      title={t('Websites allowed to embed')}
      description={t(
        'Only these websites may load the embed in an iframe. Any other site is blocked by the browser.',
      )}
    >
      <div className="flex flex-wrap gap-2">
        {allowedEmbedOrigins.length === 0 && (
          <span className="text-sm text-gray-11">
            {t('No websites allowed yet.')}
          </span>
        )}
        {allowedEmbedOrigins.map((origin) => (
          <Badge key={origin} variant="outline" className="font-mono">
            {origin}
            <button
              type="button"
              aria-label={t('Remove {name}', { name: origin })}
              disabled={isPending}
              onClick={() =>
                saveOrigins(
                  allowedEmbedOrigins.filter((item) => item !== origin),
                )
              }
              className="text-gray-11 outline-hidden hover:text-gray-12 focus-visible:text-gray-12 disabled:opacity-50"
            >
              <X className="size-3.5" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Input
            value={draft}
            aria-label={t('Website')}
            aria-invalid={invalid || undefined}
            placeholder="https://portal.example.com"
            className="max-w-md"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                add();
              }
            }}
          />
          <Button
            variant="outline"
            disabled={!valid || duplicate}
            loading={isPending && valid}
            onClick={add}
          >
            {t('Add')}
          </Button>
        </div>
        <span
          className={cn('text-xs', invalid ? 'text-danger-11' : 'text-gray-11')}
        >
          {invalid
            ? t(
                'Needs http:// or https://, no path, and only a wildcard subdomain like https://*.example.com.',
              )
            : t(
                'Wildcard subdomains are allowed, a path after the host is not.',
              )}
        </span>
      </div>
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
