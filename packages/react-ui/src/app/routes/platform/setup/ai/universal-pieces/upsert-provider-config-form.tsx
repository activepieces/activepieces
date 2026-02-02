import { t } from 'i18next';
import {
  Plus,
  Pencil,
  Trash2,
  ImageIcon,
  TextIcon,
  AlertCircle,
} from 'lucide-react';
import { useState } from 'react';
import { UseFormReturn, useFieldArray } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AIProviderName,
  AIProviderModelType,
  CreateAIProviderRequest,
  ProviderModelConfig,
} from '@activepieces/shared';

import { ModelFormPopover } from './model-form-popover';

type UpsertProviderConfigFormProps = {
  form: UseFormReturn<CreateAIProviderRequest>;
  provider: AIProviderName;
  apiKeyRequired?: boolean;
  isLoading?: boolean;
  isEditMode?: boolean;
};

export const UpsertProviderConfigForm = ({
  form,
  provider,
  apiKeyRequired = true,
  isLoading,
  isEditMode = false,
}: UpsertProviderConfigFormProps) => {
  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: 'config.models',
  });

  const [showApiKeyInput, setShowApiKeyInput] = useState(!isEditMode);

  return (
    <div className="grid space-y-4">
      <FormField
        control={form.control}
        name="auth.apiKey"
        render={({ field }) => (
          <FormItem className="grid space-y-3">
            <div className="flex items-center justify-between">
              <FormLabel htmlFor="apiKey">{t('API Key')}</FormLabel>
              {!showApiKeyInput && (
                <Button
                  type="button"
                  variant="basic"
                  size="sm"
                  onClick={() => setShowApiKeyInput(true)}
                  disabled={isLoading}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  {t('Edit')}
                </Button>
              )}
            </div>
            {showApiKeyInput && (
              <FormControl>
                <Input
                  {...field}
                  required={apiKeyRequired}
                  id="apiKey"
                  placeholder={'sk_************************'}
                  className="rounded-sm"
                  disabled={isLoading}
                />
              </FormControl>
            )}
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
                  placeholder={'your-resource-name'}
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
                    placeholder={'your-account-id'}
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
                    placeholder={'your-gateway-id'}
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

      {provider === AIProviderName.CUSTOM && (
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
                    placeholder={'your-base-url'}
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
                <FormLabel htmlFor="apiKeyHeader">
                  {t('API Key Header')}
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    required
                    id="apiKeyHeader"
                    placeholder={'your-api-key-header'}
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

      {[AIProviderName.CUSTOM, AIProviderName.CLOUDFLARE_GATEWAY].includes(
        provider,
      ) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base">{t('Models Configuration')}</Label>
            <ModelFormPopover onSubmit={(model) => append(model)}>
              <Button
                type="button"
                size="sm"
                variant="basic"
                disabled={isLoading}
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('Add Model')}
              </Button>
            </ModelFormPopover>
          </div>

          {fields.length === 0 ? (
            <div className="text-center py-8 border border-dashed rounded-lg flex flex-col items-center justify-center gap-2">
              <span className="mb-2 flex justify-center text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto" />
              </span>
              <p className="text-sm text-muted-foreground">
                {t(
                  'This provider does not support listing models via API, please add models manually.',
                )}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {fields.map((field, index) => (
                <ProviderConfigModelItem
                  key={field.id}
                  model={field as ProviderModelConfig}
                  isLoading={isLoading}
                  onUpdate={(model) => update(index, model)}
                  onRemove={() => remove(index)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

type ProviderConfigModelItemProps = {
  model: ProviderModelConfig;
  isLoading?: boolean;
  onUpdate: (model: ProviderModelConfig) => void;
  onRemove: () => void;
};

const ProviderConfigModelItem = ({
  model,
  isLoading,
  onUpdate,
  onRemove,
}: ProviderConfigModelItemProps) => {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <ModelTypeIcon modelType={model.modelType} />
          <div className="flex flex-col gap-0">
            <p className="text-sm">{model.modelName}</p>
            <p className="text-sm text-muted-foreground">{model.modelId}</p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <ModelFormPopover
          initialData={model}
          onSubmit={(updatedModel) => onUpdate(updatedModel)}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={isLoading}
          >
            <Pencil className="h-4 w-4" />
            <span className="sr-only">{t('Edit')}</span>
          </Button>
        </ModelFormPopover>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onRemove()}
          disabled={isLoading}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
          <span className="sr-only">{t('Delete')}</span>
        </Button>
      </div>
    </div>
  );
};

const ModelTypeIcon = ({ modelType }: { modelType: AIProviderModelType }) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {modelType === AIProviderModelType.IMAGE ? (
          <ImageIcon className="size-8" />
        ) : (
          <TextIcon className="size-8" />
        )}
      </TooltipTrigger>
      <TooltipContent>
        {modelType === AIProviderModelType.IMAGE
          ? t('Image Model')
          : t('Text Model')}
      </TooltipContent>
    </Tooltip>
  );
};
