import { t } from 'i18next';
import { UseFormReturn, useFieldArray } from 'react-hook-form';
import { Plus, Pencil, Trash2, ImageIcon, TextIcon } from 'lucide-react';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type UpsertProviderConfigFormProps = {
  form: UseFormReturn<CreateAIProviderRequest>;
  provider: AIProviderName;
  apiKeyRequired?: boolean;
  isLoading?: boolean;
};

export const UpsertProviderConfigForm = ({
  form,
  provider,
  apiKeyRequired = true,
  isLoading,
}: UpsertProviderConfigFormProps) => {
  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: 'config.models',
  });

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
                  required={apiKeyRequired}
                  id="apiKey"
                  placeholder={'sk_************************'}
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
                <FormLabel htmlFor="apiKeyHeader">{t('API Key Header')}</FormLabel>
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

      {[
        AIProviderName.OPENAI_COMPATIBLE,
        AIProviderName.CLOUDFLARE_GATEWAY,
      ].includes(provider) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base">{t('Models Configuration')}</Label>
            <ModelFormPopover
              onSubmit={(model) => append(model)}
            >
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isLoading}
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('Add Model')}
              </Button>
            </ModelFormPopover>
          </div>

          {fields.length === 0 ? (
            <div className="text-center py-8 border border-dashed rounded-lg">
              <p className="text-muted-foreground">
                {t('No models configured yet')}
              </p>
              <ModelFormPopover
                onSubmit={(model) => append(model)}
              >
                <Button
                  type="button"
                  variant="ghost"
                  className="mt-2"
                  disabled={isLoading}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('Add your first model')}
                </Button>
              </ModelFormPopover>
            </div>
          ) : (
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <ModelTypeIcon modelType={field.modelType} />
                      <div className="flex flex-col gap-0">
                      <p className="text-sm">{field.modelName}</p>
                      <p className="text-sm text-muted-foreground">{field.modelId}</p>
                        </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ModelFormPopover
                      initialData={field as CloudflareGatewayProviderConfig['models'][number]}
                      onSubmit={(model) => update(index, model)}
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
      </div>
  )
}


type ModelFormPopoverProps = {
  initialData?: CloudflareGatewayProviderConfig['models'][0];
  onSubmit: (model: CloudflareGatewayProviderConfig['models'][0]) => void;
  children: React.ReactNode;
};

const ModelFormPopover = ({
  initialData,
  onSubmit,
  children,
}: ModelFormPopoverProps) => {
  const [open, setOpen] = useState(false);
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
    if (!initialData) {
      setModel(defaultModel);
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">
              {initialData ? t('Edit Model') : t('Add Model')}
            </h4>
            <p className="text-sm text-muted-foreground">
              {t('Configure the model settings')}
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="modelId">{t('Model ID')}</Label>
              <Input
                id="modelId"
                value={model.modelId}
                onChange={(e) =>
                  setModel({ ...model, modelId: e.target.value })
                }
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
              <Select
                value={model.modelType}
                onValueChange={(value) =>
                  setModel({
                    ...model,
                    modelType: value as AIProviderModelType,
                  })
                }
              >
                <SelectTrigger id="modelType">
                  <SelectValue placeholder={'Select model type'} />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(AIProviderModelType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                {t('Cancel')}
              </Button>
              <Button type="submit">
                {initialData ? t('Update') : t('Add')}
              </Button>
            </div>
          </form>
        </div>
      </PopoverContent>
    </Popover>
  );
};


const ModelTypeIcon = ({ modelType }: { modelType: AIProviderModelType }) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {modelType === AIProviderModelType.IMAGE ? <ImageIcon className="size-8" /> : <TextIcon className="size-8" />}
      </TooltipTrigger>
      <TooltipContent>
        {modelType === AIProviderModelType.IMAGE ? t('Image Model') : t('Text Model')}
      </TooltipContent>
    </Tooltip>
  )
};