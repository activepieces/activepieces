import { useMutation, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { Bot, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { platformHooks } from '@/hooks/platform-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { platformApi } from '@/lib/platforms-api';
import { isNil, CopilotProviderType } from '@activepieces/shared';

import { ConfigureProviderDialog } from './configure-provider-dialog';

const CopilotSetup = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { platform, setCurrentPlatform } = platformHooks.useCurrentPlatform();
  const queryClient = useQueryClient();
  const { mutate: deleteMutation, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      const platformId = authenticationSession.getPlatformId();
      if (!platformId) return null;
      return await platformApi.update(
        {
          copilotSettings: {
            providers: {},
          },
        },
        platformId,
      );
    },
    onSuccess: (response) => {
      if (response) {
        setCurrentPlatform(queryClient, response);
      }
    },
  });

  const getConfiguredProvider = () => {
    if (!platform?.copilotSettings?.providers) return null;
    const { providers } = platform.copilotSettings;
    if (!isNil(providers[CopilotProviderType.OPENAI])) {
      return {
        type: CopilotProviderType.OPENAI,
        name: 'OpenAI',
        icon: 'https://cdn.activepieces.com/pieces/openai.png',
      };
    }

    if (!isNil(providers[CopilotProviderType.AZURE_OPENAI])) {
      return {
        type: CopilotProviderType.AZURE_OPENAI,
        name: 'Azure OpenAI',
        icon: 'https://cdn.activepieces.com/pieces/azure.png',
      };
    }

    return null;
  };

  const configuredProvider = getConfiguredProvider();

  const handleConfigure = () => {
    setDialogOpen(true);
  };

  return (
    <div className="flex flex-col gap-4">
      <Card className="w-full px-4 py-4">
        <div className="flex w-full gap-2 justify-center items-center">
          <div className="flex flex-col gap-2 text-center mr-2">
            <Bot className="size-8" />
          </div>
          <div className="flex flex-grow flex-col">
            <div className="text-lg">{t('Activepieces Copilot')}</div>
            <div className="text-sm text-muted-foreground">
              {configuredProvider
                ? t(
                    'Copilot is configured and ready to help your users build flows faster using AI.',
                  )
                : t(
                    'Configure Activepieces Copilot to help your users build flows faster using AI.',
                  )}
            </div>
          </div>
          <div className="flex flex-row justify-center items-center gap-2">
            <Button
              variant={configuredProvider ? 'ghost' : 'basic'}
              size={'sm'}
              disabled={isDeleting}
              onClick={handleConfigure}
            >
              {configuredProvider ? <Pencil className="size-4" /> : t('Enable')}
            </Button>
            {configuredProvider && (
              <Button
                variant="ghost"
                size={'sm'}
                onClick={() => {
                  deleteMutation();
                }}
                loading={isDeleting}
                className="text-destructive hover:text-destructive/90 hover:bg-destructive/10 flex items-center gap-2"
              >
                <Trash2 className="size-4" />
                {t('Remove')}
              </Button>
            )}
          </div>
        </div>
      </Card>

      <ConfigureProviderDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
};

CopilotSetup.displayName = 'CopilotSetup';
export { CopilotSetup };
