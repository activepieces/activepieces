import {
  AIProviderModelType,
  AIProviderName,
  AIProviderWithoutSensitiveData,
  MigrateFlowsModelRequest,
  MigrateFlowsModelResponse,
  ProjectWithLimits,
  SeekPage,
} from '@activepieces/shared';
import { typeboxResolver } from '@hookform/resolvers/typebox';
import { useMutation, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { ArrowLeftRight } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { MultiSelectPieceProperty } from '@/components/custom/multi-select-piece-property';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SUPPORTED_AI_PROVIDERS } from '@/features/agents/ai-providers';
import { aiProviderApi } from '@/features/platform-admin/lib/ai-provider-api';
import { api } from '@/lib/api';

type MigrateFlowsDialogProps = {
  children: React.ReactNode;
  providers: AIProviderWithoutSensitiveData[];
};

const ModelSelect = ({
  provider,
  value,
  onChange,
}: {
  provider: AIProviderName | undefined;
  value: string;
  onChange: (model: string) => void;
}) => {
  const { data: models, isLoading } = useQuery({
    queryKey: ['ai-models-for-migrate', provider],
    queryFn: () => aiProviderApi.listModelsForProvider(provider!),
    enabled: !!provider,
  });

  const textModels =
    models?.filter((m) => m.type === AIProviderModelType.TEXT) ?? [];

  return (
    <Select
      value={value}
      onValueChange={onChange}
      disabled={!provider || isLoading}
    >
      <SelectTrigger>
        <SelectValue
          placeholder={isLoading ? t('Loading...') : t('Select model')}
        />
      </SelectTrigger>
      <SelectContent>
        {textModels.map((m) => (
          <SelectItem key={m.id} value={m.id}>
            {m.name}
          </SelectItem>
        ))}
        {!isLoading && textModels.length === 0 && provider && (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            {t('No models available')}
          </div>
        )}
      </SelectContent>
    </Select>
  );
};

export const MigrateFlowsDialog = ({
  children,
  providers,
}: MigrateFlowsDialogProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <MigrateFlowsDialogContent
          key={open ? 'open' : 'closed'}
          providers={providers}
          setOpen={setOpen}
        />
      </DialogContent>
    </Dialog>
  );
};

const MigrateFlowsDialogContent = ({
  providers,
  setOpen,
}: {
  providers: AIProviderWithoutSensitiveData[];
  setOpen: (val: boolean) => void;
}) => {
  const [result, setResult] = useState<MigrateFlowsModelResponse | null>(null);

  const form = useForm<MigrateFlowsModelRequest>({
    resolver: typeboxResolver(MigrateFlowsModelRequest),
    defaultValues: {
      projectIds: [],
      sourceModel: {
        provider: undefined as unknown as AIProviderName,
        model: '',
      },
      targetModel: {
        provider: undefined as unknown as AIProviderName,
        model: '',
      },
    },
  });

  const sourceProvider = form.watch('sourceModel.provider');
  const targetProvider = form.watch('targetModel.provider');

  const { data: projectsResponse, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['platform-projects-migrate-dialog'],
    queryFn: () =>
      api.get<SeekPage<ProjectWithLimits>>('/v1/projects', { limit: 10000 }),
  });
  const projects = projectsResponse?.data ?? [];

  const { mutate, isPending } = useMutation({
    mutationFn: (data: MigrateFlowsModelRequest) =>
      aiProviderApi.migrateFlows(data),
    onSuccess: (data) => setResult(data),
    onError: () => {
      form.setError('root.serverError', {
        type: 'manual',
        message: t('Migration failed. Please try again.'),
      });
    },
  });

  const providerDisplayName = (p: AIProviderName) =>
    SUPPORTED_AI_PROVIDERS.find((sp) => sp.provider === p)?.name ?? p;

  if (result) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>{t('Migration Complete')}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-4">
          {result.updatedFlows === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t('No flows matched the source model. Nothing was changed.')}
            </p>
          ) : (
            <>
              <p className="text-sm">
                {result.updatedFlows} {t('flow(s) were successfully migrated.')}
              </p>
              <div className="flex items-center gap-2 rounded-md border p-3 bg-muted text-sm">
                <span className="font-medium">
                  {providerDisplayName(form.getValues('sourceModel.provider'))}{' '}
                  / {form.getValues('sourceModel.model')}
                </span>
                <ArrowLeftRight className="w-4 h-4 shrink-0 text-muted-foreground" />
                <span className="font-medium">
                  {providerDisplayName(form.getValues('targetModel.provider'))}{' '}
                  / {form.getValues('targetModel.model')}
                </span>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button onClick={() => setOpen(false)}>{t('Close')}</Button>
        </DialogFooter>
      </>
    );
  }

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
                  loading={isLoadingProjects}
                  onChange={(value) =>
                    field.onChange((value ?? []) as string[])
                  }
                  initialValues={(field.value ?? []) as string[]}
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
            <FormLabel>{t('Source Model')}</FormLabel>
            <div className="grid grid-cols-2 gap-2">
              <FormField
                control={form.control}
                name="sourceModel.provider"
                render={({ field }) => (
                  <Select
                    value={field.value ?? ''}
                    onValueChange={(v) => {
                      field.onChange(v);
                      form.setValue('sourceModel.model', '');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('Provider')} />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map((p) => (
                        <SelectItem key={p.provider} value={p.provider}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FormField
                control={form.control}
                name="sourceModel.model"
                render={({ field }) => (
                  <ModelSelect
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
            <FormLabel>{t('Target Model')}</FormLabel>
            <div className="grid grid-cols-2 gap-2">
              <FormField
                control={form.control}
                name="targetModel.provider"
                render={({ field }) => (
                  <Select
                    value={field.value ?? ''}
                    onValueChange={(v) => {
                      field.onChange(v);
                      form.setValue('targetModel.model', '');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('Provider')} />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map((p) => (
                        <SelectItem key={p.provider} value={p.provider}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FormField
                control={form.control}
                name="targetModel.model"
                render={({ field }) => (
                  <ModelSelect
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
};
