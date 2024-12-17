import { ReactNode, useState } from 'react';
import { t } from 'i18next';
import Markdown from 'react-markdown';
import { KeyRound, Globe, Star, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { copilotProviderApi } from '@/features/platform-admin-panel/lib/copilot-provider-api';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { cn } from '@/lib/utils';

import { CopilotProviderMetadata } from './copilot-provider-card';
import { CopilotProvider, CopilotProviderType } from '@activepieces/shared';

interface Props {
  provider?: CopilotProvider;
  providerMetadata: CopilotProviderMetadata;
  onSave: () => void;
  children: ReactNode;
  isDefault?: boolean;
}

interface FormData {
  apiKey: string;
  baseUrl?: string;
  deploymentName?: string;
  setAsDefault: boolean;
}

const FormFields = ({ 
  providerMetadata, 
  showInstructions,
  setShowInstructions,
  form 
}: { 
  providerMetadata: CopilotProviderMetadata;
  showInstructions: boolean;
  setShowInstructions: (show: boolean) => void;
  form: ReturnType<typeof useForm<FormData>>;
}) => (
  <div className="space-y-4 py-4">
    <FormField
      control={form.control}
      name="apiKey"
      rules={{ required: t('API Key is required') }}
      render={({ field }) => (
        <FormItem className="space-y-2">
          <Label className="flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            {t('API Key')}
          </Label>
          <div className="relative">
            <Input
              type="password"
              {...field}
              placeholder={t('Enter your API key')}
              autoComplete="off"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-1 hover:bg-transparent"
              onClick={() => setShowInstructions(!showInstructions)}
            >
              <AlertCircle className={cn('h-4 w-4 transition-colors', showInstructions ? 'text-primary' : 'text-muted-foreground')} />
            </Button>
          </div>
          <FormMessage />
          {showInstructions && (
            <Alert variant="default" className="mt-2 text-sm">
              <AlertDescription>
                <Markdown className="prose-sm [&>p]:my-0">{providerMetadata.instructionsMarkdown}</Markdown>
              </AlertDescription>
            </Alert>
          )}
        </FormItem>
      )}
    />

    {(providerMetadata.requiresBaseUrl || providerMetadata.defaultBaseUrl) && (
      <FormField
        control={form.control}
        name="baseUrl"
        rules={providerMetadata.requiresBaseUrl ? { required: t('Base URL is required') } : undefined}
        render={({ field }) => (
          <FormItem className="space-y-2">
            <Label className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              {t('Base URL')}
              {!providerMetadata.requiresBaseUrl && (
                <span className="ml-auto text-xs text-muted-foreground">
                  {t('Optional')}
                </span>
              )}
            </Label>
            <Input
              {...field}
              placeholder={providerMetadata.defaultBaseUrl}
              required={providerMetadata.requiresBaseUrl}
            />
            <FormMessage />
          </FormItem>
        )}
      />
    )}

    {providerMetadata.requiresDeploymentName && (
      <FormField
        control={form.control}
        name="deploymentName"
        rules={{ required: t('Deployment Name is required') }}
        render={({ field }) => (
          <FormItem className="space-y-2">
            <Label className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              {t('Deployment Name')}
            </Label>
            <Input
              {...field}
              placeholder={t('Enter your deployment name')}
              required
            />
            <FormMessage />
          </FormItem>
        )}
      />
    )}

    <FormField
      control={form.control}
      name="setAsDefault"
      render={({ field }) => (
        <FormItem className="flex items-center space-x-2">
          <Checkbox
            id="setAsDefault"
            checked={field.value}
            onCheckedChange={field.onChange}
          />
          <Label
            htmlFor="setAsDefault"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {t('Set as default {type} provider', {
              type: providerMetadata.type === CopilotProviderType.SEARCH ? 'Search' : 'Assistant',
            })}
          </Label>
        </FormItem>
      )}
    />
  </div>
);

export const UpsertCopilotProviderDialog = ({
  provider,
  providerMetadata,
  onSave,
  children,
  isDefault,
}: Props) => {
  const [open, setOpen] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<FormData>({
    defaultValues: {
      apiKey: provider?.apiKey || '',
      baseUrl: provider?.baseUrl || '',
      deploymentName: provider?.deploymentName || '',
      setAsDefault: isDefault || false,
    },
  });

  const handleSubmit = async (data: FormData) => {
    try {
      setIsSaving(true);
      const payload = {
        provider: providerMetadata.value,
        type: providerMetadata.type,
        apiKey: data.apiKey,
        setAsDefault: data.setAsDefault,
        baseUrl: data.baseUrl || providerMetadata.defaultBaseUrl || '',
        ...(providerMetadata.requiresDeploymentName && data.deploymentName ? { deploymentName: data.deploymentName } : {}),
      };

      await copilotProviderApi.upsert(payload);
      onSave();
      setOpen(false);
      toast({
        title: t('Success'),
        description: t('Provider configuration saved successfully'),
      });
    } catch (error) {
      console.error('Failed to save provider configuration', error);
      toast(INTERNAL_ERROR_TOAST);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <img
              src={providerMetadata.logoUrl}
              alt={providerMetadata.label}
              className="h-6 w-6"
            />
            {t('Configure {providerName}', {
              providerName: providerMetadata.label,
            })}
          </DialogTitle>
          <DialogDescription>
            {t('Enter your API credentials to enable the Copilot feature')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <FormFields 
              providerMetadata={providerMetadata} 
              showInstructions={showInstructions}
              setShowInstructions={setShowInstructions}
              form={form}
            />
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)} type="button">
                {t('Cancel')}
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? t('Saving...') : t('Save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}; 