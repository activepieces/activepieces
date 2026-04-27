import {
  AiProviderModelMigrationRequest,
  AIProviderModelType,
  AIProviderName,
  AIProviderWithoutSensitiveData,
  ErrorCode,
  FlowMigration,
  FlowMigrationType,
  isNil,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { t } from 'i18next';
import { Info } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { MultiSelectPieceProperty } from '@/components/custom/multi-select-piece-property';
import { SearchableSelect } from '@/components/custom/searchable-select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { projectCollectionUtils } from '@/features/projects';
import { api } from '@/lib/api';

import { flowMigrationHooks } from '../hooks/ai-provider-migration-hooks';

export function MigrateFlowsDialog({
  providers,
  open,
  onOpenChange,
  confirmFromDryCheck,
}: MigrateFlowsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col gap-3 max-w-xl">
        <MigrateFlowsForm
          key={confirmFromDryCheck?.id ?? 'new'}
          providers={providers}
          onClose={() => onOpenChange(false)}
          confirmFromDryCheck={confirmFromDryCheck}
        />
      </DialogContent>
    </Dialog>
  );
}

function MigrateFlowsForm({
  providers,
  onClose,
  confirmFromDryCheck,
}: {
  providers: AIProviderWithoutSensitiveData[];
  onClose: () => void;
  confirmFromDryCheck: FlowMigration | undefined;
}) {
  const isConfirmMode = !isNil(confirmFromDryCheck);

  const form = useForm<
    AiProviderModelMigrationRequest,
    unknown,
    AiProviderModelMigrationRequest
  >({
    resolver: zodResolver(AiProviderModelMigrationRequest),
    defaultValues:
      confirmFromDryCheck?.type === FlowMigrationType.AI_PROVIDER_MODEL
        ? {
            type: FlowMigrationType.AI_PROVIDER_MODEL,
            ...confirmFromDryCheck.params,
            dryCheck: false,
          }
        : {
            type: FlowMigrationType.AI_PROVIDER_MODEL,
            projectIds: [],
            aiProviderModelType: AIProviderModelType.TEXT,
            dryCheck: true,
          },
    mode: 'onChange',
  });

  const aiProviderModelType = form.watch('aiProviderModelType');

  const { data: projects } = projectCollectionUtils.useAllPlatformProjects();

  const providerOptions = flowMigrationHooks.useFilteredProviderOptions({
    providers,
    aiProviderModelType,
  });

  const { mutate, isPending } = flowMigrationHooks.useMigrateFlowsMutation({
    onClose,
    onError: (error) => {
      form.setError('root.serverError', {
        type: 'manual',
        message: api.isApError(
          error,
          ErrorCode.MIGRATE_FLOW_MODEL_JOB_ALREADY_EXISTS,
        )
          ? t('A migration is already running. Try again after it completes.')
          : t('Migration failed. Please try again.'),
      });
    },
  });

  const [migrationRiskAcks, setMigrationRiskAcks] = useState({
    featureLoss: false,
    blockedSkip: false,
  });

  const featureAdjustedCount =
    confirmFromDryCheck?.migratedVersions.filter(
      (v) =>
        v.changedFields?.clearedAdvancedOptions === true ||
        v.changedFields?.disabledWebSearch === true,
    ).length ?? 0;
  const blockedCount = confirmFromDryCheck?.failedFlowVersions.length ?? 0;

  const acknowledgementsSatisfied =
    (featureAdjustedCount === 0 || migrationRiskAcks.featureLoss) &&
    (blockedCount === 0 || migrationRiskAcks.blockedSkip);
  const submitBlocked = isPending || !acknowledgementsSatisfied;

  return (
    <>
      <DialogTitle>
        {isConfirmMode ? t('Run migration') : t('Migrate AI Model')}
      </DialogTitle>
      {!isConfirmMode && (
        <p className="text-sm text-muted-foreground">
          {t('Migrate flows from one AI provider or model to another.')}
        </p>
      )}

      <Form {...form}>
        <form
          className="flex flex-col gap-5 py-2"
          onSubmit={form.handleSubmit((data) =>
            mutate(isConfirmMode ? { ...data, dryCheck: false } : data),
          )}
        >
          <Alert>
            <Info className="size-4" />
            <AlertDescription className="flex flex-col gap-2">
              <p>
                {t(
                  "Before running the migration, test the target model on a sample flow — features like web search and image generation aren't supported by every model (e.g. gpt-4 on OpenAI rejects the web search tool).",
                )}
              </p>
              <p>
                {t(
                  'Some step settings that depend on the provider or model (e.g. image generation options like size, quality, background, or web search options) will be reset to the defaults of the target provider/model you choose. The previous version is preserved — to view it, open the flow, click the chevron next to its name, then choose (Versions).',
                )}
              </p>
            </AlertDescription>
          </Alert>

          <FormField
            control={form.control}
            name="projectIds"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-2">
                <FormLabel showRequiredIndicator>{t('Projects')}</FormLabel>
                <MultiSelectPieceProperty
                  placeholder={t('Select at least one project')}
                  options={projects.map((p) => ({
                    value: p.id,
                    label: p.displayName,
                  }))}
                  onChange={(value) =>
                    field.onChange(value?.map((v) => `${v}`) ?? [])
                  }
                  initialValues={field.value ?? []}
                  showDeselect={(field.value?.length ?? 0) > 0}
                  disabled={isConfirmMode}
                />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="aiProviderModelType"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="migrate-image-models"
                    checked={field.value === AIProviderModelType.IMAGE}
                    disabled={isConfirmMode}
                    onCheckedChange={(checked) => {
                      form.reset({
                        ...form.getValues(),
                        aiProviderModelType:
                          checked === true
                            ? AIProviderModelType.IMAGE
                            : AIProviderModelType.TEXT,
                        sourceModel: {
                          provider: undefined as unknown as AIProviderName,
                          model: '',
                        },
                        targetModel: {
                          provider: undefined as unknown as AIProviderName,
                          model: '',
                        },
                      });
                    }}
                  />
                  <Label htmlFor="migrate-image-models">
                    {t('Migrate Image Models')}
                  </Label>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sourceModel"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-2">
                <FormLabel showRequiredIndicator>{t('Source Model')}</FormLabel>
                <ProviderModelSelects
                  providerOptions={providerOptions}
                  modelType={aiProviderModelType}
                  value={{
                    provider: field.value?.provider,
                    model: field.value?.model,
                  }}
                  onChange={field.onChange}
                  disabled={isConfirmMode}
                />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="targetModel"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-2">
                <FormLabel showRequiredIndicator>{t('Target Model')}</FormLabel>
                <ProviderModelSelects
                  providerOptions={providerOptions}
                  modelType={aiProviderModelType}
                  value={{
                    provider: field.value?.provider,
                    model: field.value?.model,
                  }}
                  onChange={field.onChange}
                  disabled={isConfirmMode}
                />
              </FormItem>
            )}
          />

          {!isConfirmMode && (
            <FormField
              control={form.control}
              name="dryCheck"
              render={({ field }) => (
                <FormItem>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="run-dry-check-first"
                        checked={field.value === true}
                        onCheckedChange={(checked) =>
                          field.onChange(checked === true)
                        }
                      />
                      <Label htmlFor="run-dry-check-first">
                        {t('Run a dry-check first (recommended)')}
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground pl-6">
                      {t(
                        'A dry-check runs the migration against every flow without saving anything. Use the results to decide whether to proceed.',
                      )}
                    </p>
                  </div>
                </FormItem>
              )}
            />
          )}

          {featureAdjustedCount > 0 && (
            <AckCheckbox
              id="ack-feature-loss"
              checked={migrationRiskAcks.featureLoss}
              onChange={(v) =>
                setMigrationRiskAcks((s) => ({ ...s, featureLoss: v }))
              }
              label={t(
                "I understand {count} flow(s) will have some step settings related to image generation or web search reset to the target provider's defaults.",
                { count: featureAdjustedCount },
              )}
            />
          )}
          {blockedCount > 0 && (
            <AckCheckbox
              id="ack-blocked-skip"
              checked={migrationRiskAcks.blockedSkip}
              onChange={(v) =>
                setMigrationRiskAcks((s) => ({ ...s, blockedSkip: v }))
              }
              label={t(
                'I understand {count} flow(s) will be skipped because the migration failed for them.',
                { count: blockedCount },
              )}
            />
          )}

          {form.formState.errors.root?.serverError && (
            <FormMessage>
              {form.formState.errors.root.serverError.message}
            </FormMessage>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={onClose}
              disabled={isPending}
            >
              {t('Cancel')}
            </Button>
            <Button type="submit" loading={isPending} disabled={submitBlocked}>
              {t('Run migration')}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
}

type ProviderOption = {
  value: AIProviderName;
  label: string;
  logoUrl?: string;
};

function ProviderModelSelects({
  providerOptions,
  modelType,
  value,
  onChange,
  disabled,
}: {
  providerOptions: ProviderOption[];
  modelType: AIProviderModelType;
  value: { provider?: AIProviderName; model?: string };
  onChange: (next: { provider?: AIProviderName; model: string }) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <SearchableSelect
        options={providerOptions}
        value={value.provider}
        onChange={(v) => onChange({ provider: v ?? undefined, model: '' })}
        placeholder={t('Provider')}
        valuesRendering={(optValue) => {
          const option = providerOptions.find((p) => p.value === optValue);
          if (!option) return null;
          return (
            <div className="flex items-center gap-2">
              {option.logoUrl && (
                <img
                  src={option.logoUrl}
                  alt={option.label}
                  className="size-4 rounded-sm object-contain"
                />
              )}
              <span>{option.label}</span>
            </div>
          );
        }}
        disabled={disabled}
      />
      <ModelSelect
        provider={value.provider}
        modelType={modelType}
        value={value.model ?? ''}
        disabled={disabled}
        onChange={(model) => onChange({ ...value, model })}
      />
    </div>
  );
}

function ModelSelect({
  provider,
  modelType,
  value,
  onChange,
  disabled,
}: {
  provider: AIProviderName | undefined;
  modelType: AIProviderModelType;
  value: string;
  onChange: (model: string) => void;
  disabled?: boolean;
}) {
  const { options, isLoading } =
    flowMigrationHooks.useAiProviderModelsForMigrateSelect({
      provider,
      modelType,
    });

  return (
    <SearchableSelect
      options={options}
      value={value || undefined}
      onChange={(v) => onChange(v ?? '')}
      placeholder={provider ? t('Select model') : t('Select a provider first')}
      disabled={disabled || isNil(provider)}
      loading={isLoading && !isNil(provider)}
    />
  );
}

function AckCheckbox({
  id,
  checked,
  onChange,
  label,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(v) => onChange(v === true)}
      />
      <Label htmlFor={id} className="text-xs leading-relaxed">
        {label}
      </Label>
    </div>
  );
}

type MigrateFlowsDialogProps = {
  providers: AIProviderWithoutSensitiveData[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  confirmFromDryCheck?: FlowMigration;
};
