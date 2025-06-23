import { t } from 'i18next';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { platformHooks } from '@/hooks/platform-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { platformApi } from '@/lib/platforms-api';
import {
  AzureOpenAiProvider,
  CopilotProviderType,
  CopilotSettings,
  OpenAiProvider,
} from '@activepieces/shared';

type ConfigureProviderDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const ConfigureProviderDialog = ({
  open,
  onOpenChange,
}: ConfigureProviderDialogProps) => {
  const { platform, refetch } = platformHooks.useCurrentPlatform();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openaiProvider = platform?.copilotSettings?.providers?.[
    CopilotProviderType.OPENAI
  ] as OpenAiProvider | undefined;

  const [selectedProvider, setSelectedProvider] = useState<CopilotProviderType>(
    CopilotProviderType.OPENAI,
  );
  const [formData, setFormData] = useState({
    baseUrl: openaiProvider?.baseUrl || 'https://api.openai.com',
    apiKey: openaiProvider?.apiKey || '',
    resourceName: '',
    deploymentName: '',
  });

  const handleProviderChange = (value: CopilotProviderType) => {
    setSelectedProvider(value);
    const azureProvider = platform?.copilotSettings?.providers?.[
      CopilotProviderType.AZURE_OPENAI
    ] as AzureOpenAiProvider | undefined;
    const openaiProvider = platform?.copilotSettings?.providers?.[
      CopilotProviderType.OPENAI
    ] as OpenAiProvider | undefined;

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

      const newSettings: CopilotSettings = {
        providers: {
          [selectedProvider]:
            selectedProvider === CopilotProviderType.OPENAI
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

      await platformApi.update(
        {
          copilotSettings: newSettings,
        },
        platformId,
      );

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
      <DialogContent className="sm:max-w-[425px] p-4">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-lg font-medium">
            {t('Configure AI Provider')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <RadioGroup
            value={selectedProvider}
            onValueChange={handleProviderChange}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={CopilotProviderType.OPENAI} id="openai" />
              <label
                htmlFor="openai"
                className="flex items-center gap-2 cursor-pointer text-sm"
              >
                <img
                  src="https://cdn.activepieces.com/pieces/openai.png"
                  alt="OpenAI"
                  className="w-4 h-4"
                />
                OpenAI
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value={CopilotProviderType.AZURE_OPENAI}
                id="azure"
              />
              <label
                htmlFor="azure"
                className="flex items-center gap-2 cursor-pointer text-sm"
              >
                <img
                  src="https://cdn.activepieces.com/pieces/azure-openai.png"
                  alt="Azure OpenAI"
                  className="w-4 h-4"
                />
                Azure OpenAI
              </label>
            </div>
          </RadioGroup>

          <div className="space-y-3">
            {selectedProvider === CopilotProviderType.OPENAI ? (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t('Base URL')}</label>
                  <Input
                    value={formData.baseUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, baseUrl: e.target.value })
                    }
                    placeholder="https://api.openai.com"
                    disabled={isSubmitting}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t('API Key')}</label>
                  <Input
                    type="password"
                    value={formData.apiKey}
                    onChange={(e) =>
                      setFormData({ ...formData, apiKey: e.target.value })
                    }
                    placeholder="sk-..."
                    disabled={isSubmitting}
                    className="h-9"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    {t('Resource Name')}
                  </label>
                  <Input
                    value={formData.resourceName}
                    onChange={(e) =>
                      setFormData({ ...formData, resourceName: e.target.value })
                    }
                    placeholder="my-resource"
                    disabled={isSubmitting}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    {t('Deployment Name')}
                  </label>
                  <Input
                    value={formData.deploymentName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        deploymentName: e.target.value,
                      })
                    }
                    placeholder="gpt-4"
                    disabled={isSubmitting}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t('API Key')}</label>
                  <Input
                    type="password"
                    value={formData.apiKey}
                    onChange={(e) =>
                      setFormData({ ...formData, apiKey: e.target.value })
                    }
                    placeholder="Enter API key"
                    disabled={isSubmitting}
                    className="h-9"
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="h-9 px-4 text-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
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
