import {
  AI_PROVIDER_CAPABILITIES,
  AI_ROUTING_TIER_IDS,
  AIProviderWithoutSensitiveData,
  AiRoutingTierId,
  AiRoutingTiers,
  GetAiRoutingResponse,
  UpsertAiRoutingRequest,
  isNil,
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
import { TIER_CONFIG } from '@/features/agents/tier-config';
import {
  aiProviderQueries,
  aiRoutingMutations,
  aiRoutingQueries,
} from '@/features/platform-admin';
import { cn } from '@/lib/utils';

export function ModelRoutingSection() {
  const { data, refetch } = aiRoutingQueries.useAiRouting();

  if (isNil(data)) {
    return null;
  }

  return (
    <ModelRoutingForm
      key={routingSignature(data)}
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
  const issues = buildSlotIssues({ tiers, providers });
  const saveBlocked = issues.length > 0;

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
                'Each tier runs its Main model and falls over to Backup 1, then Backup 2, when a provider fails. Backups must support everything the Main model supports.',
              )}
            </p>
          </div>
        </div>

        {AI_ROUTING_TIER_IDS.map((tierId) => (
          <TierCard
            key={tierId}
            tierId={tierId}
            form={form}
            issues={issues.filter((issue) => issue.tierId === tierId)}
          />
        ))}

        {form.formState.errors.root?.serverError && (
          <FormMessage>
            {form.formState.errors.root.serverError.message}
          </FormMessage>
        )}

        <div className="flex items-center justify-end gap-3">
          {saveBlocked && form.formState.isDirty && (
            <p className="text-xs text-muted-foreground">
              {t('Fix the highlighted slots to save')}
            </p>
          )}
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
            disabled={!form.formState.isDirty || saveBlocked}
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
  issues,
}: {
  tierId: AiRoutingTierId;
  form: UseFormReturn<UpsertAiRoutingRequest>;
  issues: SlotIssue[];
}) {
  const tier = useWatch({ control: form.control, name: `tiers.${tierId}` });
  const tierConfig = TIER_CONFIG[tierId];
  const TierIcon = tierConfig.icon;
  return (
    <div className="rounded-lg border bg-card p-4 flex flex-col gap-3">
      <div className="flex items-baseline gap-2">
        <TierIcon className="size-4 text-muted-foreground self-center shrink-0" />
        <p className="text-sm font-medium leading-none">
          {t(tierConfig.displayLabel)}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {t(tierConfig.description)}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {SLOT_KEYS.map((slotKey) => {
          const slot = tier[slotKey];
          const issue = issues.find((issue) => issue.slotKey === slotKey);
          return (
            <div key={slotKey} className="flex flex-col gap-1">
              <div className="grid grid-cols-[5.5rem_1fr] items-center gap-3">
                <span
                  className={cn('text-xs', {
                    'font-medium': slotKey === 'main',
                    'text-muted-foreground': slotKey !== 'main',
                  })}
                >
                  {SLOT_LABELS[slotKey]()}
                </span>
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
              {issue && (
                <div className="grid grid-cols-[5.5rem_1fr] gap-3">
                  <span />
                  <p className="flex items-center gap-1.5 text-xs text-destructive">
                    <TriangleAlert className="size-3 shrink-0" />
                    {issue.message}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function routingSignature(routing: GetAiRoutingResponse): string {
  return `${routing.isDefault}:${JSON.stringify(routing.tiers)}`;
}

function translateRoutingError({ message }: { message: string }): string {
  const [code, tierId, provider] = message.split(':');
  if (ROUTING_ERROR_CODES.includes(code)) {
    return t(code, { tier: tierLabelOf({ tierId }), provider });
  }
  return message;
}

function tierLabelOf({ tierId }: { tierId: string }): string {
  const config = TIER_CONFIG[tierId as AiRoutingTierId];
  return isNil(config) ? tierId : t(config.displayLabel);
}

// Every issue mirrors a condition the server rejects on save (or zod rejects client-side), so the
// Save button is gated on them instead of letting the user submit into a guaranteed 400.
function buildSlotIssues({
  tiers,
  providers,
}: {
  tiers: AiRoutingTiers;
  providers: AIProviderWithoutSensitiveData[] | undefined;
}): SlotIssue[] {
  const configured = isNil(providers)
    ? undefined
    : new Set(providers.map((provider) => provider.provider));
  return AI_ROUTING_TIER_IDS.flatMap((tierId) => {
    const tier = tiers[tierId];
    const mainCapabilities = AI_PROVIDER_CAPABILITIES[tier.main.provider];
    return SLOT_KEYS.flatMap((slotKey) => {
      const slot = tier[slotKey];
      if (slot.modelId.length === 0) {
        return [{ tierId, slotKey, message: t('Pick a model') }];
      }
      if (!isNil(configured) && !configured.has(slot.provider)) {
        return [
          {
            tierId,
            slotKey,
            message: t('aiRouting.providerNotConfigured', {
              tier: tierLabelOf({ tierId }),
              provider: slot.provider,
            }),
          },
        ];
      }
      if (slotKey === 'main') {
        return [];
      }
      const backupCapabilities = AI_PROVIDER_CAPABILITIES[slot.provider];
      const messages: SlotIssue[] = [];
      if (
        mainCapabilities.supportsImageGeneration &&
        !backupCapabilities.supportsImageGeneration
      ) {
        messages.push({
          tierId,
          slotKey,
          message: t('aiRouting.capabilityMismatch.imageGeneration', {
            tier: tierLabelOf({ tierId }),
            provider: slot.provider,
          }),
        });
      }
      if (
        !isNil(mainCapabilities.webSearch) &&
        isNil(backupCapabilities.webSearch)
      ) {
        messages.push({
          tierId,
          slotKey,
          message: t('aiRouting.capabilityMismatch.webSearch', {
            tier: tierLabelOf({ tierId }),
            provider: slot.provider,
          }),
        });
      }
      return messages;
    });
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

type SlotIssue = {
  tierId: AiRoutingTierId;
  slotKey: (typeof SLOT_KEYS)[number];
  message: string;
};
