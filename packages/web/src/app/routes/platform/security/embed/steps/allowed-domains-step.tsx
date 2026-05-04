import {
  allowedEmbedOriginSchema,
  ApFlagId,
  MAX_ALLOWED_EMBED_ORIGINS,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { platformApi } from '@/api/platforms-api';
import { TagInput } from '@/components/custom/tag-input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { internalErrorToast } from '@/components/ui/sonner';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

import { StepShell } from '../stepper';

const isValidOrigin = (value: string): boolean =>
  allowedEmbedOriginSchema.safeParse(value).success;

const AllowedOriginsForm = z.object({
  origins: z
    .array(z.string())
    .max(MAX_ALLOWED_EMBED_ORIGINS, 'tooManyEmbedOrigins')
    .refine((items) => items.every(isValidOrigin), 'invalidEmbedOrigin'),
});

type AllowedOriginsForm = z.infer<typeof AllowedOriginsForm>;

export const AllowedDomainsStep = ({
  allowedEmbedOrigins,
}: {
  allowedEmbedOrigins: string[];
}) => {
  const { platform, refetch } = platformHooks.useCurrentPlatform();
  const { data: envAllowedOrigins } = flagsHooks.useFlag<string[]>(
    ApFlagId.ALLOWED_EMBED_ORIGINS,
  );

  const form = useForm<AllowedOriginsForm>({
    resolver: zodResolver(AllowedOriginsForm),
    defaultValues: { origins: allowedEmbedOrigins },
    mode: 'onChange',
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: AllowedOriginsForm) => {
      await platformApi.update(
        { allowedEmbedOrigins: values.origins },
        platform.id,
      );
      await refetch();
    },
    onSuccess: () => {
      toast.success(t('Allowed domains updated'));
    },
    onError: () => internalErrorToast(),
  });

  return (
    <StepShell
      title={t('Add allowed domains')}
      description={t(
        'List the websites that can load your embed in an iframe. All other origins are blocked.',
      )}
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((values) => mutate(values))}
          className="flex flex-col gap-2"
        >
          <FormField
            name="origins"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Allowed websites')}</FormLabel>
                <p className="text-xs text-muted-foreground">
                  {t(
                    'Press Enter or use a comma to add another, e.g. https://app.acme.com',
                  )}
                </p>
                <FormControl>
                  <TagInput
                    value={field.value}
                    onChange={(next) => field.onChange([...next])}
                    validateItem={isValidOrigin}
                    placeholder="https://app.acme.com"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
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
                  <Badge
                    key={d}
                    variant="outline"
                    className="font-mono text-xs"
                  >
                    {d}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-end mt-6">
            <Button size="sm" type="submit" disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin mr-2" />}
              {t('Save')}
            </Button>
          </div>
        </form>
      </Form>
    </StepShell>
  );
};
