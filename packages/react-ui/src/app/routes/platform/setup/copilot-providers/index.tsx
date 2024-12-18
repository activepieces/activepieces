import { t } from 'i18next';
import { TableTitle } from '@/components/ui/table-title';
import { platformHooks } from '@/hooks/platform-hooks';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { ConfigureProviderDialog } from './configure-provider-dialog';
import { CopilotProviderType } from '@activepieces/shared';
import { isNil } from '@activepieces/shared';
import { Card } from '@/components/ui/card';
import { Pencil } from 'lucide-react';

const CopilotSettingsPage = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const getConfiguredProvider = () => {
    if (!platform?.copilotSettings?.providers) return null;
    const { providers } = platform.copilotSettings;

    if (!isNil(providers[CopilotProviderType.OPENAI]?.apiKey)) {
      return {
        type: CopilotProviderType.OPENAI,
        name: 'OpenAI',
        icon: 'https://cdn.activepieces.com/pieces/openai.png',
      };
    }

    if (!isNil(providers[CopilotProviderType.AZURE_OPENAI]?.apiKey)) {
      return {
        type: CopilotProviderType.AZURE_OPENAI,
        name: 'Azure OpenAI',
        icon: 'https://cdn.activepieces.com/pieces/azure.png',
      };
    }

    return null;
  };

  const configuredProvider = getConfiguredProvider();

  return (
    <div className="flex flex-col w-full">
      <div className="mb-4 flex flex-col gap-2">
        <TableTitle>{t('Copilot')}</TableTitle>
        <div className="text-md text-muted-foreground">
          {t('Configure AI provider credentials for the Copilot feature to enable code generation and assistance during flow creation.')}
        </div>
      </div>
      <div className="space-y-4">
        {configuredProvider ? (
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src={configuredProvider.icon}
                  alt={configuredProvider.name}
                  className="w-6 h-6"
                />
                <span className="text-sm font-medium">{configuredProvider.name}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsDialogOpen(true)}>
                <Pencil className="size-4" />
              </Button>
            </div>
          </Card>
        ) : (
          <Button onClick={() => setIsDialogOpen(true)}>
            {t('Configure AI Provider')}
          </Button>
        )}
      </div>
      <ConfigureProviderDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
};

CopilotSettingsPage.displayName = 'CopilotSettingsPage';
export { CopilotSettingsPage };
