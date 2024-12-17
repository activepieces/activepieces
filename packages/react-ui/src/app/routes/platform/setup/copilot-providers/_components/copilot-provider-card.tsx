import { t } from 'i18next';
import { CheckCircle2, Pencil, Trash } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { platformHooks } from '@/hooks/platform-hooks';
import { CopilotProvider, CopilotProviderType, CopilotSettings } from '@activepieces/shared';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import { UpsertCopilotProviderDialog } from './upsert-provider-dialog';

export type CopilotProviderMetadata = {
  logoUrl: string;
  label: string;
  value: 'openai' | 'azure' | 'anthropic' | 'perplexity';
  defaultBaseUrl?: string;
  requiresBaseUrl?: boolean;
  requiresDeploymentName?: boolean;
  instructionsMarkdown: string;
  type: CopilotProviderType;
};

type Props = {
  providerMetadata: CopilotProviderMetadata;
  defaultBaseUrl?: string;
  onDelete: () => void;
  onSave: () => void;
  isDeleting: boolean;
};

const createEmptySettings = (): CopilotSettings => ({
  providers: [],
  defaultSearchProvider: undefined,
  defaultAssistantProvider: undefined,
});

export const CopilotProviderCard = ({
  providerMetadata,
  defaultBaseUrl,
  onDelete,
  isDeleting,
  onSave,
}: Props) => {
  const { platform } = platformHooks.useCurrentPlatform();
  const copilotSettings = platform.copilotSettings || createEmptySettings();
  const provider = (copilotSettings.providers || []).find(p => p.provider === providerMetadata.value);
  const isConfigured = !!provider;
  const isDefault = providerMetadata.type === CopilotProviderType.SEARCH 
    ? copilotSettings.defaultSearchProvider === providerMetadata.value
    : copilotSettings.defaultAssistantProvider === providerMetadata.value;

  return (
    <Card className="w-full p-5">
      <div className="flex w-full gap-4 items-center">
        <div className="flex items-center gap-3">
          {isConfigured && (
            <Tooltip>
              <TooltipTrigger asChild>
                <CheckCircle2 className="w-5 h-5 text-success" />
              </TooltipTrigger>
              <TooltipContent>{t('Provider configured')}</TooltipContent>
            </Tooltip>
          )}
          <div className="relative h-10 w-10 shrink-0">
            <img
              src={providerMetadata.logoUrl}
              alt={providerMetadata.label}
              className="h-full w-full object-contain"
            />
          </div>
        </div>
        <div className="flex flex-grow flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium">{providerMetadata.label}</div>
            {isConfigured && isDefault && (
              <Badge variant="outline" className="text-[11px] h-5 bg-muted/50 text-muted-foreground border-0">
                {providerMetadata.type === CopilotProviderType.SEARCH ? t('Default Search') : t('Default Assistant')}
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {isConfigured
              ? t('Provider configured and ready to use')
              : t('Configure credentials for {providerName} Copilot provider', {
                  providerName: providerMetadata.label,
                })}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <UpsertCopilotProviderDialog
            provider={provider}
            providerMetadata={providerMetadata}
            onSave={onSave}
            isDefault={isDefault}
          >
            <Button
              variant="ghost"
              size="sm"
              className="h-8"
            >
              {isConfigured ? (
                <Pencil className="h-4 w-4" />
              ) : (
                t('Configure')
              )}
            </Button>
          </UpsertCopilotProviderDialog>
          {isConfigured && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              disabled={isDeleting}
              className="h-8 hover:text-destructive"
            >
              <Trash className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}; 