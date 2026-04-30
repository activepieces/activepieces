import { ApFlagId } from '@activepieces/shared';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { platformApi } from '@/api/platforms-api';
import { TagInput } from '@/components/custom/tag-input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { internalErrorToast } from '@/components/ui/sonner';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

import { StepShell } from '../stepper';

export const AllowedDomainsStep = ({
  allowedEmbedDomains,
}: {
  allowedEmbedDomains: string[];
}) => {
  const { platform, refetch } = platformHooks.useCurrentPlatform();
  const { data: envAllowedDomains } = flagsHooks.useFlag<string[]>(
    ApFlagId.ALLOWED_EMBED_DOMAINS,
  );
  const [domains, setDomains] =
    useState<readonly string[]>(allowedEmbedDomains);
  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      await platformApi.update(
        { allowedEmbedDomains: [...domains] },
        platform.id,
      );
      await refetch();
    },
    onSuccess: () => {
      toast.success(t('Allowed domains updated'));
    },
    onError: () => internalErrorToast(),
  });

  const handleSave = () => {
    mutate();
  };

  return (
    <StepShell
      title={t('Add allowed domains')}
      description={t(
        'List the websites that can load your embed in an iframe. All other origins are blocked.',
      )}
    >
      <div className="flex flex-col gap-2">
        <Label>{t('Allowed websites')}</Label>
        <p className="text-xs text-muted-foreground">
          {t(
            'Press Enter or use a comma to add another, e.g. https://app.acme.com',
          )}
        </p>
        <TagInput
          value={domains}
          onChange={setDomains}
          placeholder="https://app.acme.com"
        />
        {envAllowedDomains && envAllowedDomains.length > 0 && (
          <div className="mt-2 flex flex-col gap-1.5">
            <p className="text-xs text-muted-foreground">
              {t(
                'These domains are also allowed automatically (configured via AP_ALLOWED_EMBED_DOMAINS):',
              )}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {envAllowedDomains.map((d) => (
                <Badge key={d} variant="outline" className="font-mono text-xs">
                  {d}
                </Badge>
              ))}
            </div>
          </div>
        )}
        <div className="flex justify-end mt-6">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isPending}
            type="button"
          >
            {isPending && <Loader2 className="size-4 animate-spin mr-2" />}
            {t('Save')}
          </Button>
        </div>
      </div>
    </StepShell>
  );
};
