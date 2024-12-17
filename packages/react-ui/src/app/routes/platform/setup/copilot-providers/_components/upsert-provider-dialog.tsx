import { ReactNode, useState } from 'react';
import { t } from 'i18next';
import Markdown from 'react-markdown';
import { AlertCircle, KeyRound, Globe, Star } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { copilotProviderApi } from '@/features/platform-admin-panel/lib/copilot-provider-api';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';

import { CopilotProviderMetadata } from './copilot-provider-card';
import { CopilotProvider, CopilotProviderType } from '@activepieces/shared';

type Props = {
  provider?: CopilotProvider;
  providerMetadata: CopilotProviderMetadata;
  onSave: () => void;
  children: ReactNode;
  isDefault?: boolean;
};

export const UpsertCopilotProviderDialog = ({
  provider,
  providerMetadata,
  onSave,
  children,
  isDefault,
}: Props) => {
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState(provider?.apiKey || '');
  const [baseUrl, setBaseUrl] = useState(provider?.baseUrl || '');
  const [setAsDefault, setSetAsDefault] = useState(isDefault || false);
  const [isSaving, setIsSaving] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const handleSave = async () => {
    if (!apiKey) {
      toast({
        title: t('Error'),
        description: t('Please enter your API key'),
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSaving(true);
      await copilotProviderApi.upsert({
        provider: providerMetadata.value,
        baseUrl: baseUrl || providerMetadata.defaultBaseUrl,
        apiKey,
        type: providerMetadata.type,
        setAsDefault,
      });
      onSave();
      setOpen(false);
      toast({
        title: t('Success'),
        description: t('Provider configuration saved successfully'),
      });
    } catch (e) {
      console.error('Failed to save provider configuration', e);
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
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <KeyRound className="h-4 w-4" />
              {t('API Key')}
            </Label>
            <div className="relative">
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
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
            {showInstructions && (
              <Alert variant="default" className="mt-2 text-sm">
                <AlertDescription>
                  <Markdown className="prose-sm [&>p]:my-0">{providerMetadata.instructionsMarkdown}</Markdown>
                </AlertDescription>
              </Alert>
            )}
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              {t('Base URL')}
              <span className="ml-auto text-xs text-muted-foreground">
                {t('Optional')}
              </span>
            </Label>
            <Input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder={providerMetadata.defaultBaseUrl}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="setAsDefault"
              checked={setAsDefault}
              onCheckedChange={(checked) => setSetAsDefault(checked as boolean)}
            />
            <Label
              htmlFor="setAsDefault"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {t('Set as default {type} provider', {
                type: providerMetadata.type === CopilotProviderType.SEARCH ? 'Search' : 'Assistant',
              })}
            </Label>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {t('Cancel')}
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !apiKey}>
            {isSaving ? t('Saving...') : t('Save')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 