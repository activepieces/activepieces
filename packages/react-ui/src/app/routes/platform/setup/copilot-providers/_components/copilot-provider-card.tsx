import { t } from 'i18next';
import { Check, Pencil, Trash } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { platformHooks } from '@/hooks/platform-hooks';
import { CopilotProvider, CopilotProviderType, CopilotSettings } from '@activepieces/shared';

import { UpsertCopilotProviderDialog } from './upsert-provider-dialog';

export type CopilotProviderMetadata = {
  logoUrl: string;
  label: string;
  value: 'openai' | 'anthropic' | 'perplexity';
  defaultBaseUrl: string;
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
    <Card className={`group relative overflow-hidden transition-all duration-200 hover:shadow-md ${isConfigured ? 'bg-card' : 'bg-background hover:border-primary/50'}`}>
      <div className="p-6">
        <div className="flex items-center gap-4">
          <div className="relative h-12 w-12 shrink-0">
            <img
              src={providerMetadata.logoUrl}
              alt={providerMetadata.label}
              className="h-full w-full object-contain"
            />
            {isConfigured && (
              <div className="absolute -right-1 -bottom-1 rounded-full bg-primary p-0.5">
                <Check className="h-3 w-3 text-primary-foreground" />
              </div>
            )}
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold tracking-tight">{providerMetadata.label}</h3>
              {isConfigured && (
                <>
                  <Badge variant="outline" className="bg-primary/10 text-xs">
                    {t('Active')}
                  </Badge>
                  {isDefault && (
                    <Badge variant="outline" className="bg-warning-100 text-warning-500 text-xs">
                      {t('Default {type}', {
                        type: providerMetadata.type === CopilotProviderType.SEARCH ? 'Search' : 'Assistant',
                      })}
                    </Badge>
                  )}
                </>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {isConfigured
                ? t('Provider configured and ready to use')
                : t('Configure credentials for {providerName} Copilot provider', {
                    providerName: providerMetadata.label,
                  })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <UpsertCopilotProviderDialog
              provider={provider}
              providerMetadata={providerMetadata}
              onSave={onSave}
              isDefault={isDefault}
            >
              <Button
                variant={isConfigured ? 'ghost' : 'default'}
                size="sm"
                className={`transition-colors ${isConfigured ? 'opacity-0 group-hover:opacity-100 hover:bg-background' : ''}`}
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
                className="opacity-0 group-hover:opacity-100 hover:bg-background hover:text-destructive"
              >
                <Trash className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
      {isConfigured && (
        <div className="absolute inset-y-0 left-0 w-1 bg-primary" />
      )}
    </Card>
  );
}; 