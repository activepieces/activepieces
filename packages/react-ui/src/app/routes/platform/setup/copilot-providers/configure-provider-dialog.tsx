import { t } from 'i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AzureOpenAiProvider, CopilotProviderType, CopilotSettings, OpenAiProvider } from '@activepieces/shared';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { platformApi } from '@/lib/platforms-api';
import { authenticationSession } from '@/lib/authentication-session';
import { useToast } from '@/components/ui/use-toast';
import { platformHooks } from '@/hooks/platform-hooks';
import { Loader2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

type ConfigureProviderDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const ConfigureProviderDialog = ({ open, onOpenChange }: ConfigureProviderDialogProps) => {
  const { platform, refetch } = platformHooks.useCurrentPlatform();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<CopilotProviderType>(CopilotProviderType.OPENAI);
  const [formData, setFormData] = useState({
    baseUrl: 'https://api.openai.com',
    apiKey: '',
    resourceName: '',
    deploymentName: '',
  });

  const handleProviderChange = (value: CopilotProviderType) => {
    setSelectedProvider(value);
    const azureProvider = platform?.copilotSettings?.providers?.[CopilotProviderType.AZURE_OPENAI] as AzureOpenAiProvider | undefined;
    const openaiProvider = platform?.copilotSettings?.providers?.[CopilotProviderType.OPENAI] as OpenAiProvider | undefined;


    if (value === CopilotProviderType.OPENAI) {
      setFormData({
        baseUrl: openaiProvider?.baseUrl || 'https://api.openai.com',
        apiKey: openaiProvider?.apiKey || '',
        resourceName: '',
        deploymentName: '',
      });
    } else {
      setFormData({
        baseUrl: '',
        apiKey: azureProvider?.apiKey || '',
        resourceName: azureProvider?.resourceName || '',
        deploymentName: azureProvider?.deploymentName || '',
      });
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const platformId = authenticationSession.getPlatformId();
      if (!platformId) return;

      const currentSettings = platform?.copilotSettings || { providers: {} };
      const newSettings: CopilotSettings = {
        providers: {
          ...currentSettings.providers,
          [selectedProvider]: selectedProvider === CopilotProviderType.OPENAI
            ? {
                baseUrl: formData.baseUrl,
                apiKey: formData.apiKey,
              }
            : {
                resourceName: formData.resourceName,
                deploymentName: formData.deploymentName,
                apiKey: formData.apiKey,
              },
        },
      };

      await platformApi.update({
        copilotSettings: newSettings,
      }, platformId);

      await refetch();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to configure provider:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('Configure AI Provider')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <RadioGroup
            value={selectedProvider}
            onValueChange={handleProviderChange}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={CopilotProviderType.OPENAI} id="openai" />
              <label htmlFor="openai" className="flex items-center gap-2 cursor-pointer">
                <img
                  src="https://cdn.activepieces.com/pieces/openai.png"
                  alt="OpenAI"
                  className="w-4 h-4"
                />
                OpenAI
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={CopilotProviderType.AZURE_OPENAI} id="azure" />
              <label htmlFor="azure" className="flex items-center gap-2 cursor-pointer">
                <img
                  src="https://cdn.activepieces.com/pieces/azure-openai.png"
                  alt="Azure OpenAI"
                  className="w-4 h-4"
                />
                Azure OpenAI
              </label>
            </div>
          </RadioGroup>

          <div className="space-y-4">
            {selectedProvider === CopilotProviderType.OPENAI ? (
              <>
                <div>
                  <label className="text-sm font-medium">{t('Base URL')}</label>
                  <Input
                    value={formData.baseUrl}
                    onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                    placeholder="https://api.openai.com"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">{t('API Key')}</label>
                  <Input
                    type="password"
                    value={formData.apiKey}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    placeholder="sk-..."
                    disabled={isSubmitting}
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="text-sm font-medium">{t('Resource Name')}</label>
                  <Input
                    value={formData.resourceName}
                    onChange={(e) => setFormData({ ...formData, resourceName: e.target.value })}
                    placeholder="my-resource"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">{t('Deployment Name')}</label>
                  <Input
                    value={formData.deploymentName}
                    onChange={(e) => setFormData({ ...formData, deploymentName: e.target.value })}
                    placeholder="gpt-4"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">{t('API Key')}</label>
                  <Input
                    type="password"
                    value={formData.apiKey}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    placeholder="Enter API key"
                    disabled={isSubmitting}
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  {t('Saving')}
                </>
              ) : (
                t('Save')
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 