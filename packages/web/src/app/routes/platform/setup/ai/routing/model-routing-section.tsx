import {
  ACTIVEPIECES_CHAT_TIERS,
  AI_PROVIDER_CAPABILITIES,
  AI_ROUTING_TIER_IDS,
  AIProviderWithoutSensitiveData,
  AiRoutingTierId,
  AiRoutingTiers,
  GetAiRoutingResponse,
  UpsertAiRoutingRequest,
  isNil,
  unique,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { t } from 'i18next';
import { Route, TriangleAlert } from 'lucide-react';
import { useForm, UseFormReturn, useWatch } from 'react-hook-form';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Form, FormMessage } from '@/components/ui/form';
import { AIModelSelector } from '@/features/agents/ai-model';
import {
  aiProviderQueries,
  aiRoutingMutations,
  aiRoutingQueries,
} from '@/features/platform-admin';

export function ModelRoutingSection() {
  const { data, refetch, dataUpdatedAt } = aiRoutingQueries.useAiRouting();

  if (isNil(data)) {
    return null;
  }

  return (
    <ModelRoutingForm
      key={dataUpdatedAt}
      routing={data}
      onSaved={() => refetch()}
    />
  );
}

ModelRoutingSection.displayName = 'ModelRoutingSection';

function ModelRoutingForm({
  routing,
  onSaved,
}: {
  routing: GetAiRoutingResponse;
  onSaved: () => void;
}) {
  const { data: providers } = aiProviderQueries.useAiProviders();
  const form = useForm<UpsertAiRoutingRequest>({
    resolver: zodResolver(UpsertAiRoutingRequest),
    defaultValues: { tiers: routing.tiers },
    mode: 'onChange',
  });

  const { mutate: upsertRouting, isPending } =
    aiRoutingMutations.useUpsertAiRouting({
      onSuccess: onSaved,
      onError: (error) => {
        const message = error.response?.data?.params?.message;
        form.setError('root.serverError', {
          type: 'manual',
          message: isNil(message)
            ? t('Something went wrong, please try again later')
            : translateRoutingError({ message }),
        });
      },
    });

  const { mutateAsync: resetRouting } = aiRoutingMutations.useResetAiRouting({
    onSuccess: onSaved,
  });

  const tiers = form.watch('tiers');
  const warnings = unique(buildRoutingWarnings({ tiers, providers }));

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((request) => {
          form.clearErrors('root.serverError');
          upsertRouting(request);
        })}
        className="flex flex-col gap-4 mb-6"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
            <Route className="size-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-none flex items-center gap-2">
              {t('Model Routing')}
              {routing.isDefault && (
                <Badge variant="outline">{t('Using defaults')}</Badge>
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t(
                'Pick a main model and two backups for each tier. Fast slots also warm up the other tiers, so changing them affects Expert and Heavy too.',
              )}
            </p>
          </div>
        </div>

        {AI_ROUTING_TIER_IDS.map((tierId) => (
          <TierCard key={tierId} tierId={tierId} form={form} />
        ))}

        {warnings.map((warning) => (
          <p
            key={warning}
            className="flex items-center gap-2 text-xs text-warning"
          >
            <TriangleAlert className="size-3.5 shrink-0" />
            {warning}
          </p>
        ))}

        {form.formState.errors.root?.serverError && (
          <FormMessage>
            {form.formState.errors.root.serverError.message}
          </FormMessage>
        )}

        <div className="flex justify-end gap-2">
          {!routing.isDefault && (
            <ConfirmationDeleteDialog
              title={t('Reset to defaults')}
              message={t(
                'This removes your custom model routing and falls back to the defaults derived from your chat provider.',
              )}
              entityName={t('Model Routing')}
              buttonText={t('Reset')}
              mutationFn={async () => {
                await resetRouting();
              }}
            >
              <Button variant="outline" type="button">
                {t('Reset to defaults')}
              </Button>
            </ConfirmationDeleteDialog>
          )}
          <Button
            type="submit"
            disabled={!form.formState.isDirty}
            loading={isPending}
          >
            {t('Save')}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function TierCard({
  tierId,
  form,
}: {
  tierId: AiRoutingTierId;
  form: UseFormReturn<UpsertAiRoutingRequest>;
}) {
  const tier = useWatch({ control: form.control, name: `tiers.${tierId}` });
  return (
    <div className="rounded-lg border bg-card p-4 flex flex-col gap-3">
      <p className="text-sm font-medium leading-none">
        {tierLabelOf({ tierId })}
      </p>
      {SLOT_KEYS.map((slotKey) => {
        const slot = tier[slotKey];
        return (
          <div key={slotKey} className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-20 shrink-0">
              {SLOT_LABELS[slotKey]()}
            </span>
            <div className="flex-1 min-w-0">
              <AIModelSelector
                compact
                preserveUnknownModel
                defaultProvider={slot.provider}
                defaultModel={slot.modelId}
                onChange={({ provider, model }) =>
                  form.setValue(
                    `tiers.${tierId}.${slotKey}`,
                    {
                      provider: provider ?? slot.provider,
                      modelId: model ?? '',
                    },
                    { shouldDirty: true, shouldValidate: true },
                  )
                }
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function tierLabelOf({ tierId }: { tierId: string }): string {
  return (
    ACTIVEPIECES_CHAT_TIERS.find((tier) => tier.id === tierId)?.label ?? tierId
  );
}

function translateRoutingError({ message }: { message: string }): string {
  const [code, tierId, provider] = message.split(':');
  if (ROUTING_ERROR_CODES.includes(code)) {
    return t(code, { tier: tierLabelOf({ tierId }), provider });
  }
  return message;
}

function buildRoutingWarnings({
  tiers,
  providers,
}: {
  tiers: AiRoutingTiers;
  providers: AIProviderWithoutSensitiveData[] | undefined;
}): string[] {
  if (isNil(providers)) {
    return [];
  }
  const configured = new Set(providers.map((provider) => provider.provider));
  return AI_ROUTING_TIER_IDS.flatMap((tierId) => {
    const tier = tiers[tierId];
    const tierLabel = tierLabelOf({ tierId });
    const notConfigured = SLOT_KEYS.filter(
      (slotKey) => !configured.has(tier[slotKey].provider),
    ).map((slotKey) =>
      t('aiRouting.providerNotConfigured', {
        tier: tierLabel,
        provider: tier[slotKey].provider,
      }),
    );
    const mainCapabilities = AI_PROVIDER_CAPABILITIES[tier.main.provider];
    const mismatches = (['backup1', 'backup2'] as const).flatMap((slotKey) => {
      const backupCapabilities =
        AI_PROVIDER_CAPABILITIES[tier[slotKey].provider];
      const messages: string[] = [];
      if (
        mainCapabilities.supportsImageGeneration &&
        !backupCapabilities.supportsImageGeneration
      ) {
        messages.push(
          t('aiRouting.capabilityMismatch.imageGeneration', {
            tier: tierLabel,
            provider: tier[slotKey].provider,
          }),
        );
      }
      if (
        !isNil(mainCapabilities.webSearch) &&
        isNil(backupCapabilities.webSearch)
      ) {
        messages.push(
          t('aiRouting.capabilityMismatch.webSearch', {
            tier: tierLabel,
            provider: tier[slotKey].provider,
          }),
        );
      }
      return messages;
    });
    return [...notConfigured, ...mismatches];
  });
}

const SLOT_KEYS = ['main', 'backup1', 'backup2'] as const;

const SLOT_LABELS: Record<(typeof SLOT_KEYS)[number], () => string> = {
  main: () => t('Main'),
  backup1: () => t('Backup 1'),
  backup2: () => t('Backup 2'),
};

const ROUTING_ERROR_CODES = [
  'aiRouting.providerNotConfigured',
  'aiRouting.capabilityMismatch.imageGeneration',
  'aiRouting.capabilityMismatch.webSearch',
];
