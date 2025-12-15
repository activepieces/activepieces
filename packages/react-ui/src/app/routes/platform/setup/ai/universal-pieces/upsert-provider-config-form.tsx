import { t } from 'i18next';
import { UseFormReturn, useFieldArray } from 'react-hook-form';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AIProviderName,
  AIProviderModelType,
  CloudflareGatewayProviderConfig,
  CreateAIProviderRequest,
} from '@activepieces/shared';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type UpsertProviderConfigFormProps = {
  form: UseFormReturn<CreateAIProviderRequest>;
  provider: AIProviderName;
  isLoading?: boolean;
};

export const UpsertProviderConfigForm = ({
  form,
  provider,
  isLoading,
}: UpsertProviderConfigFormProps) => {
  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: 'config.models',
  });

  const [modelDialogOpen, setModelDialogOpen] = useState(false);
  const [editingModelIndex, setEditingModelIndex] = useState<number | undefined>(undefined);

  const handleAddOrEditModel = (
    model: CloudflareGatewayProviderConfig['models'][0]
  ) => {
    if (editingModelIndex !== undefined) {
      update(editingModelIndex, model);
      setEditingModelIndex(undefined);
    } else {
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
    <div className="grid space-y-4">
      <FormField
        control={form.control}
        name="config.apiKey"
        render={({ field }) => (
          <FormItem className="grid space-y-3">
            <FormLabel htmlFor="apiKey">{t('API Key')}</FormLabel>
            <FormControl>
                <Input
                  {...field}
                  required
                  id="apiKey"
                  placeholder={t('sk_************************')}
                  className="rounded-sm"
                  disabled={isLoading}
                />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {provider === AIProviderName.AZURE && (
        <FormField
          control={form.control}
          name="config.resourceName"
          render={({ field }) => (
            <FormItem className="grid space-y-3">
              <FormLabel htmlFor="resourceName">{t('Resource Name')}</FormLabel>
              <FormControl>
                  <Input
                    {...field}
                    required
                    id="resourceName"
                    placeholder={t('your-resource-name')}
                    className="rounded-sm"
                    disabled={isLoading}
                  />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {provider === AIProviderName.CLOUDFLARE_GATEWAY && (
        <>
          <FormField
            control={form.control}
            name="config.accountId"
            render={({ field }) => (
              <FormItem className="grid space-y-3">
                <FormLabel htmlFor="accountId">{t('Account ID')}</FormLabel>
                <FormControl>
                    <Input
                      {...field}
                      required
                      id="accountId"
                      placeholder={t('your-account-id')}
                      className="rounded-sm"
                      disabled={isLoading}
                    />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="config.gatewayId"
            render={({ field }) => (
              <FormItem className="grid space-y-3">
                <FormLabel htmlFor="gatewayId">{t('Gateway ID')}</FormLabel>
                <FormControl>
                    <Input
                      {...field}
                      required
                      id="gatewayId"
                      placeholder={t('your-gateway-id')}
                      className="rounded-sm"
                      disabled={isLoading}
                    />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}

      {provider === AIProviderName.OPENAI_COMPATIBLE && (
        <>
          <FormField
            control={form.control}
            name="config.baseUrl"
            render={({ field }) => (
              <FormItem className="grid space-y-3">
                <FormLabel htmlFor="baseUrl">{t('Base URL')}</FormLabel>
                <FormControl>
                    <Input
                      {...field}
                      required
                      id="baseUrl"
                      placeholder={t('your-base-url')}
                      className="rounded-sm"
                      disabled={isLoading}
                    />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="config.apiKeyHeader"
            render={({ field }) => (
              <FormItem className="grid space-y-3">
                <FormLabel htmlFor="apiKeyHeader">{t('API Key Header')}</FormLabel>
                <FormControl>
                    <Input
                      {...field}
                      required
                      id="apiKeyHeader"
                      placeholder={t('your-api-key-header')}
                      className="rounded-sm"
                      disabled={isLoading}
                    />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}

      {[
        AIProviderName.OPENAI_COMPATIBLE,
        AIProviderName.CLOUDFLARE_GATEWAY,
      ].includes(provider) && (
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
              <p className="text-muted-foreground">
                {t('No models configured yet')}
              </p>
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
      )}

      <ModelFormDialog
        open={modelDialogOpen}
        onOpenChange={setModelDialogOpen}
        onSubmit={handleAddOrEditModel}
        editingIndex={editingModelIndex}
        initialData={
          editingModelIndex !== undefined
            ? (fields[editingModelIndex] as CloudflareGatewayProviderConfig['models'][0])
            : undefined
        }
      />
    </div>
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
  initialData,
}: ModelFormDialogProps) => {
  const defaultModel: CloudflareGatewayProviderConfig['models'][number] = {
    modelId: '',
    modelName: '',
    modelType: AIProviderModelType.TEXT,
  };

  const [model, setModel] = useState<
    CloudflareGatewayProviderConfig['models'][number]
  >(initialData || defaultModel);

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
            {editingIndex !== undefined ? 'Edit Model' : 'Add Model'}
          </DialogTitle>
          <DialogDescription>
            {t('Configure the model settings')}
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
              onChange={(e) =>
                setModel({ ...model, modelName: e.target.value })
              }
              placeholder="e.g., GPT-4"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="modelType">{t('Model Type')}</Label>
            <select
              id="modelType"
              value={model.modelType}
              onChange={(e) =>
                setModel({
                  ...model,
                  modelType: e.target.value as AIProviderModelType,
                })
              }
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
