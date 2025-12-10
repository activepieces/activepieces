import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Type } from '@sinclair/typebox';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useEffect, useMemo, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormMessage, FormLabel, FormControl } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { aiProviderApi } from '@/features/platform-admin/lib/ai-provider-api';
import { flagsHooks } from '@/hooks/flags-hooks';
import {
  AIProviderConfig,
  AIProviderModelType,
  AIProviderName,
  AnthropicProviderConfig,
  AzureProviderConfig,
  CloudflareGatewayProviderConfig,
  CreateAIProviderRequest,
  GoogleProviderConfig,
  OpenAIProviderConfig,
} from '@activepieces/shared';

import { ApMarkdown } from '../../../../../../components/custom/markdown';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { aiProviderHooks } from '@/features/platform-admin/lib/ai-provider-hooks';

type UpsertAIProviderDialogProps = {
  provider: AIProviderName;
  configured: boolean;
  logoUrl: string;
  markdown: string;
  displayName: string;
  children: React.ReactNode;
  onSave: () => void;
};

export const UpsertAIProviderDialog = ({
  children,
  onSave,
  provider,
  configured,
  displayName,
  markdown,
}: UpsertAIProviderDialogProps) => {
  const [open, setOpen] = useState(false);
  const [modelDialogOpen, setModelDialogOpen] = useState(false);
  const [editingModelIndex, setEditingModelIndex] = useState<number | undefined>(undefined);

  const { data: config, isLoading } = aiProviderHooks.useConfig(provider, open);

  const formSchema = useMemo(() => {
    if (provider === AIProviderName.AZURE) {
      return Type.Object({
        provider: Type.Literal(AIProviderName.AZURE),
        config: AzureProviderConfig,
      });
    }
    if (provider === AIProviderName.CLOUDFLARE_GATEWAY) {
      return Type.Object({
        provider: Type.Literal(AIProviderName.CLOUDFLARE_GATEWAY),
        config: CloudflareGatewayProviderConfig,
      });
    }
    return Type.Object({
      provider: Type.Literal(provider),
      config: Type.Union([
        AnthropicProviderConfig,
        GoogleProviderConfig,
        OpenAIProviderConfig,
      ]),
    });
  }, [provider]);

  const form = useForm<CreateAIProviderRequest>({
    resolver: typeboxResolver(formSchema),
    defaultValues: { provider, config: {} },
  });

  // Reset form with fetched data when it becomes available
  useEffect(() => {
    if (config && open) {
      form.reset({ provider, config } as CreateAIProviderRequest);
    }
  }, [config, open, provider, form]);

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: 'config.models',
  });

  const { refetch: refetchFlags } = flagsHooks.useFlags();

  const { mutate, isPending } = useMutation({
    mutationFn: (): Promise<void> => {
      return aiProviderApi.upsert(form.getValues());
    },
    onSuccess: () => {
      form.reset({});
      setOpen(false);
      refetchFlags();
      onSave();
    },
    onError: () => {
      setOpen(false);
    },
  });

  const handleAddOrEditModel = (model: CloudflareGatewayProviderConfig['models'][0]) => {
    if (editingModelIndex !== undefined) {
      // Update existing model
      update(editingModelIndex, model);
      setEditingModelIndex(undefined);
    } else {
      // Add new model
      append(model);
    }
  };

  const handleEditModel = (index: number) => {
    setEditingModelIndex(index);
    setModelDialogOpen(true);
  };

  const handleRemoveModel = (index: number) => {
    remove(index);
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(open) => {
          if (!open) {
            form.reset({});
            setEditingModelIndex(undefined);
          }
          setOpen(open);
        }}
      >
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {configured ? t('Update AI Provider') : t('Enable AI Provider')} (
              {displayName})
            </DialogTitle>
          </DialogHeader>

          {markdown && (
            <div className="mb-4">
              <ApMarkdown markdown={markdown}></ApMarkdown>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Form {...form}>
              <form className="grid space-y-4" onSubmit={(e) => e.preventDefault()}>
                <FormField
                  name="config.apiKey"
                  render={({ field }) => (
                    <FormItem className="grid space-y-3">
                      <Label htmlFor="apiKey">{t('API Key')}</Label>
                      <div className="flex gap-2 items-center justify-center">
                        <Input
                          autoFocus
                          {...field}
                          required
                          id="apiKey"
                          placeholder={t('sk_************************')}
                          className="rounded-sm"
                          disabled={isLoading}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {provider === AIProviderName.AZURE && (
                  <FormField
                    name="config.resourceName"
                    render={({ field }) => (
                      <FormItem className="grid space-y-3">
                        <Label htmlFor="resourceName">{t('Resource Name')}</Label>
                        <div className="flex gap-2 items-center justify-center">
                          <Input
                            {...field}
                            required
                            id="resourceName"
                            placeholder={t('your-resource-name')}
                            className="rounded-sm"
                            disabled={isLoading}
                          />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                {provider === AIProviderName.CLOUDFLARE_GATEWAY && (
                  <>
                    <FormField
                      name="config.accountId"
                      render={({ field }) => (
                        <FormItem className="grid space-y-3">
                          <Label htmlFor="accountId">{t('Account ID')}</Label>
                          <div className="flex gap-2 items-center justify-center">
                            <Input
                              {...field}
                              required
                              id="accountId"
                              placeholder={t('your-account-id')}
                              className="rounded-sm"
                              disabled={isLoading}
                            />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      name="config.gatewayId"
                      render={({ field }) => (
                        <FormItem className="grid space-y-3">
                          <Label htmlFor="gatewayId">{t('Gateway ID')}</Label>
                          <div className="flex gap-2 items-center justify-center">
                            <Input
                              {...field}
                              required
                              id="gatewayId"
                              placeholder={t('your-gateway-id')}
                              className="rounded-sm"
                              disabled={isLoading}
                            />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-base">{t('Models Configuration')}</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingModelIndex(undefined);
                            setModelDialogOpen(true);
                          }}
                          disabled={isLoading}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          {t('Add Model')}
                        </Button>
                      </div>

                      {fields.length === 0 ? (
                        <div className="text-center py-8 border border-dashed rounded-lg">
                          <p className="text-muted-foreground">{t('No models configured yet')}</p>
                          <Button
                            type="button"
                            variant="ghost"
                            className="mt-2"
                            onClick={() => {
                              setEditingModelIndex(undefined);
                              setModelDialogOpen(true);
                            }}
                            disabled={isLoading}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            {t('Add your first model')}
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {fields.map((field, index) => (
                            <div
                              key={field.id}
                              className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  <Badge variant="ghost" className="font-mono">
                                    {field.modelId}
                                  </Badge>
                                  <span className="font-medium">{field.modelName}</span>
                                  <Badge variant="outline">{field.modelType}</Badge>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditModel(index)}
                                  disabled={isLoading}
                                >
                                  <Pencil className="h-4 w-4" />
                                  <span className="sr-only">{t('Edit')}</span>
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveModel(index)}
                                  disabled={isLoading}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                  <span className="sr-only">{t('Delete')}</span>
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {form?.formState?.errors?.root?.serverError && (
                  <FormMessage>
                    {form.formState.errors.root.serverError.message}
                  </FormMessage>
                )}
              </form>
            </Form>
          )}

          <DialogFooter>
            <Button
              variant={'outline'}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setOpen(false);
              }}
              disabled={isLoading}
            >
              {t('Cancel')}
            </Button>
            <Button
              disabled={!form.formState.isValid || isLoading}
              loading={isPending || isLoading}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                mutate();
              }}
            >
              {t('Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Model Form Dialog */}
      <ModelFormDialog
        open={modelDialogOpen}
        onOpenChange={setModelDialogOpen}
        onSubmit={handleAddOrEditModel}
        editingIndex={editingModelIndex}
        initialData={
          editingModelIndex !== undefined 
            ? fields[editingModelIndex] as CloudflareGatewayProviderConfig['models'][0]
            : undefined
        }
      />
    </>
  );
};


type ModelFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (model: CloudflareGatewayProviderConfig['models'][0]) => void;
  editingIndex?: number;
  initialData?: CloudflareGatewayProviderConfig['models'][0];
};

const ModelFormDialog = ({
  open,
  onOpenChange,
  onSubmit,
  editingIndex,
  initialData
}: ModelFormDialogProps) => {
  const defaultModel: CloudflareGatewayProviderConfig['models'][0] = {
    modelId: '',
    modelName: '',
    modelType: AIProviderModelType.TEXT,
  };

  const [model, setModel] = useState<CloudflareGatewayProviderConfig['models'][0]>(
    initialData || defaultModel
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(model);
    setModel(defaultModel);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingIndex !== undefined ? t('Edit Model') : t('Add Model')}
          </DialogTitle>
          <DialogDescription>
            {t('Configure the model settings for Cloudflare Gateway')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="modelId">{t('Model ID')}</Label>
            <Input
              id="modelId"
              value={model.modelId}
              onChange={(e) => setModel({ ...model, modelId: e.target.value })}
              placeholder="e.g., gpt-4"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="modelName">{t('Model Name')}</Label>
            <Input
              id="modelName"
              value={model.modelName}
              onChange={(e) => setModel({ ...model, modelName: e.target.value })}
              placeholder="e.g., GPT-4"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="modelType">{t('Model Type')}</Label>
            <select
              id="modelType"
              value={model.modelType}
              onChange={(e) => setModel({ ...model, modelType: e.target.value as AIProviderModelType })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {Object.values(AIProviderModelType).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t('Cancel')}
            </Button>
            <Button type="submit">
              {editingIndex !== undefined ? t('Update') : t('Add')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};