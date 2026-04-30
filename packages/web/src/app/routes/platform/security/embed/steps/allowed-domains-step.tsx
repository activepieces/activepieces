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
  allowedEmbedOrigins,
}: {
  allowedEmbedOrigins: string[];
}) => {
  const { platform, refetch } = platformHooks.useCurrentPlatform();
  const { data: envAllowedOrigins } = flagsHooks.useFlag<string[]>(
    ApFlagId.ALLOWED_EMBED_ORIGINS,
  );
  const [origins, setOrigins] =
    useState<readonly string[]>(allowedEmbedOrigins);
  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      await platformApi.update(
        { allowedEmbedOrigins: [...origins] },
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
          value={origins}
          onChange={setOrigins}
          placeholder="https://app.acme.com"
        />
        {envAllowedOrigins && envAllowedOrigins.length > 0 && (
          <div className="mt-2 flex flex-col gap-1.5">
            <p className="text-xs text-muted-foreground">
              {t(
                'These origins are also allowed automatically (configured via AP_ALLOWED_EMBED_ORIGINS):',
              )}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {envAllowedOrigins.map((d) => (
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
