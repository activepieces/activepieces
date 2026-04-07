import {
  AIProviderName,
  AIProviderWithoutSensitiveData,
  ErrorCode,
  isNil,
  MigrateFlowsModelRequest,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { MultiSelectPieceProperty } from '@/components/custom/multi-select-piece-property';
import { SearchableSelect } from '@/components/custom/searchable-select';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { SUPPORTED_AI_PROVIDERS } from '@/features/agents';
import { aiProviderApi } from '@/features/platform-admin';
import { projectCollectionUtils } from '@/features/projects';
import { api } from '@/lib/api';

import { aiProviderMigrationKeys } from './ai-provider-migrations-hooks';

export function MigrateFlowsDialog({
  providers,
  open,
  onOpenChange,
}: MigrateFlowsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col">
        <MigrateFlowsDialogContent
          key={open ? 'open' : 'closed'}
          providers={providers}
          setOpen={onOpenChange}
        />
      </DialogContent>
    </Dialog>
  );
}

function ModelSearchableSelect({
  provider,
  value,
  onChange,
}: {
  provider: AIProviderName | undefined;
  value: string;
  onChange: (model: string) => void;
}) {
  const { data: models, isLoading } = useQuery({
    queryKey: ['ai-models-for-migrate', provider],
    queryFn: () => aiProviderApi.listModelsForProvider(provider!),
    enabled: !!provider,
  });

  const options = (models ?? []).map((m) => ({
    value: m.id,
    label: m.name,
  }));
  return (
    <SearchableSelect
      options={options}
      value={value || undefined}
      onChange={(v) => onChange(v ?? '')}
      placeholder={provider ? t('Select model') : t('Select a provider first')}
      disabled={isNil(provider)}
      loading={isLoading && !isNil(provider)}
    />
  );
}

function MigrateFlowsDialogContent({
  providers,
  setOpen,
}: {
  providers: AIProviderWithoutSensitiveData[];
  setOpen: (val: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const form = useForm<MigrateFlowsModelRequest>({
    resolver: zodResolver(MigrateFlowsModelRequest),
    defaultValues: {
      projectIds: []
    },
  });

  const sourceProvider = form.watch('sourceModel.provider');
  const targetProvider = form.watch('targetModel.provider');

  const { data: projects } = projectCollectionUtils.useAllPlatformProjects();

  const providerOptions = providers.map((p) => {
    const info = SUPPORTED_AI_PROVIDERS.find(
      (sp) => sp.provider === p.provider,
    );
    return {
      value: p.provider,
      label: p.name,
      logoUrl: info?.logoUrl,
    };
  });

  const renderProviderOption = (value: unknown) => {
    const provider = providerOptions.find((p) => p.value === value);
    if (!provider) return null;
    return (
      <div className="flex items-center gap-2">
        {provider.logoUrl && (
          <img
            src={provider.logoUrl}
            alt={provider.label}
            className="size-4 rounded-sm object-contain"
          />
        )}
        <span>{provider.label}</span>
      </div>
    );
  };

  const { mutate, isPending } = useMutation({
    mutationFn: (data: MigrateFlowsModelRequest) =>
      aiProviderApi.migrateFlows(data),
    onSuccess: () => {
      setOpen(false);
      toast.success(t('Migration started.'));
      queryClient.invalidateQueries({
        queryKey: aiProviderMigrationKeys.list(),
      });
    },
    onError: (error) => {
      if (
        api.isApError(error, ErrorCode.MIGRATE_FLOW_MODEL_JOB_ALREADY_EXISTS)
      ) {
        form.setError('root.serverError', {
          type: 'manual',
          message: t(
            'A migration job is already running. try again later after it completes.',
          ),
        });
        return;
      }
      form.setError('root.serverError', {
        type: 'manual',
        message: t('Migration failed. Please try again.'),
      });
    },
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t('Migrate AI Model')}</DialogTitle>
      </DialogHeader>

      <Form {...form}>
        <form
          className="flex flex-col gap-5 py-2"
          onSubmit={form.handleSubmit((data) => mutate(data))}
        >
          <FormField
            control={form.control}
            name="projectIds"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-2">
                <FormLabel>{t('Projects')}</FormLabel>
                <MultiSelectPieceProperty
                  placeholder={t('All projects')}
                  options={projects.map((p) => ({
                    value: p.id,
                    label: p.displayName,
                  }))}
                  onChange={(value) =>
                    field.onChange(value?.map((v) => `${v}`) ?? [])
                  }
                  initialValues={(field.value ?? [])}
                  showDeselect={(field.value?.length ?? 0) > 0}
                />
                <p className="text-xs text-muted-foreground">
                  {t('Leave empty to apply to all projects.')}
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormItem className="flex flex-col gap-2">
            <FormLabel htmlFor="sourceModel.provider" showRequiredIndicator>{t('Source Model')}</FormLabel>
            <div className="grid grid-cols-2 gap-2">
              <FormField
                control={form.control}
                name="sourceModel.provider"
                render={({ field }) => (
                  <SearchableSelect
                    options={providerOptions}
                    value={field.value}
                    onChange={(v) => {
                      field.onChange(v);
                      form.setValue('sourceModel.model', '');
                    }}
                    placeholder={t('Provider')}
                    valuesRendering={renderProviderOption}
                  />
                )}
              />
              <FormField
                control={form.control}
                name="sourceModel.model"
                render={({ field }) => (
                  <ModelSearchableSelect
                    provider={sourceProvider}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
            <FormMessage>
              {form.formState.errors.sourceModel?.provider?.message ??
                form.formState.errors.sourceModel?.model?.message}
            </FormMessage>
          </FormItem>

          <FormItem className="flex flex-col gap-2">
            <FormLabel htmlFor="targetModel.provider" showRequiredIndicator>{t('Target Model')}</FormLabel>
            <div className="grid grid-cols-2 gap-2">
              <FormField
                control={form.control}
                name="targetModel.provider"
                render={({ field }) => (
                  <SearchableSelect
                    options={providerOptions}
                    value={field.value}
                    onChange={(v) => {
                      field.onChange(v);
                      form.setValue('targetModel.model', '');
                    }}
                    placeholder={t('Provider')}
                    valuesRendering={renderProviderOption}
                  />
                )}
              />
              <FormField
                control={form.control}
                name="targetModel.model"
                render={({ field }) => (
                  <ModelSearchableSelect
                    provider={targetProvider}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
            <FormMessage>
              {form.formState.errors.targetModel?.provider?.message ??
                form.formState.errors.targetModel?.model?.message}
            </FormMessage>
          </FormItem>

          {form.formState.errors.root?.serverError && (
            <FormMessage>
              {form.formState.errors.root.serverError.message}
            </FormMessage>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              {t('Cancel')}
            </Button>
            <Button type="submit" loading={isPending} disabled={isPending}>
              {t('Migrate')}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
}

type MigrateFlowsDialogProps = {
  providers: AIProviderWithoutSensitiveData[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};
