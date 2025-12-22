import { t } from 'i18next';
import { Pencil, Trash } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AIProviderWithoutSensitiveData } from '@activepieces/shared';

import { AiProviderInfo } from './supported-ai-providers';
import { UpsertAIProviderDialog } from './upsert-provider-dialog';

type AIProviderCardProps = {
  providerInfo: AiProviderInfo;
  providerConfig?: AIProviderWithoutSensitiveData;
  onDelete: (id: string) => void;
  onSave: () => void;
  isDeleting: boolean;
  allowWrite?: boolean;
};

const AIProviderCard = ({
  providerInfo,
  providerConfig,
  onDelete,
  isDeleting,
  onSave,
  allowWrite = true,
}: AIProviderCardProps) => {
  const logoUrl = providerInfo.logoUrl;

  return (
    <Card className="w-full px-5 py-4">
      <div className="flex w-full gap-2 justify-center items-center">
        <div className="flex flex-col gap-2 text-center mr-2">
          {logoUrl && <img src={logoUrl} alt="icon" width={32} height={32} />}
        </div>
        <div className="flex grow flex-col">
          <div className="text-lg flex items-center">
            {providerConfig?.name ?? providerInfo.name}
          </div>
          {allowWrite && (
            <div className="text-sm text-muted-foreground">
              {t('Configure credentials for {providerName} AI provider.', {
                providerName: providerInfo.name,
              })}
            </div>
          )}
        </div>
        {allowWrite && (
          <div className="flex flex-row justify-center items-center gap-1">
            <UpsertAIProviderDialog
              key={providerConfig?.id ?? providerInfo.provider}
              providerId={providerConfig?.id}
              config={providerConfig?.config}
              provider={providerInfo.provider}
              defaultDisplayName={providerConfig?.name ?? providerInfo.name}
              onSave={onSave}
            >
              {providerConfig ? (
                <Button variant={'ghost'} size={'sm'}>
                  <Pencil className="size-4" />
                </Button>
              ) : (
                <Button variant={'outline-primary'} size={'sm'}>
                  {t('Enable')}
                </Button>
              )}
            </UpsertAIProviderDialog>
            {providerConfig && (
              <div className="gap-2 flex">
                <Button
                  variant={'ghost'}
                  size={'sm'}
                  onClick={() => onDelete(providerConfig.id)}
                  loading={isDeleting}
                  disabled={isDeleting}
                >
                  <Trash className="size-4 text-destructive" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

AIProviderCard.displayName = 'AIProviderCard';
export { AIProviderCard };
