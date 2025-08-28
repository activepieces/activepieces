import { t } from 'i18next';
import { Pencil, Trash } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SupportedAIProvider } from '@activepieces/common-ai';

import { UpsertAIProviderDialog } from './upsert-provider-dialog';

type AIProviderCardProps = {
  providerMetadata: SupportedAIProvider;
  isConfigured: boolean;
  onDelete: () => void;
  onSave: () => void;
  isDeleting: boolean;
  allowWrite?: boolean;
  showAzureOpenAI?: boolean;
};

const AIProviderCard = ({
  providerMetadata,
  isConfigured,
  onDelete,
  isDeleting,
  onSave,
  allowWrite = true,
  showAzureOpenAI = false,
}: AIProviderCardProps) => {
  return (
    <Card className="w-full px-4 py-4">
      <div className="flex w-full gap-2 justify-center items-center">
        <div className="flex flex-col gap-2 text-center mr-2">
          <img
            src={
              showAzureOpenAI
                ? 'https://cdn.activepieces.com/pieces/azure-openai.png'
                : providerMetadata.logoUrl
            }
            alt="icon"
            width={32}
            height={32}
          />
        </div>
        <div className="flex flex-grow flex-col">
          <div className="text-lg flex items-center">
            {showAzureOpenAI
              ? `${providerMetadata.displayName} / Azure ${providerMetadata.displayName}`
              : providerMetadata.displayName}
          </div>
          {allowWrite && (
            <div className="text-sm text-muted-foreground">
              {t('Configure credentials for {providerName} AI provider.', {
                providerName: providerMetadata.displayName,
              })}
            </div>
          )}
        </div>
        {allowWrite && (
          <div className="flex flex-row justify-center items-center gap-1">
            <UpsertAIProviderDialog
              provider={providerMetadata.provider}
              providerMetadata={providerMetadata}
              isConfigured={isConfigured}
              onSave={onSave}
              showAzureOpenAI={showAzureOpenAI}
            >
              <Button variant={isConfigured ? 'ghost' : 'basic'} size={'sm'}>
                {isConfigured ? <Pencil className="size-4" /> : t('Enable')}
              </Button>
            </UpsertAIProviderDialog>
            {isConfigured && (
              <div className="gap-2 flex">
                <Button
                  variant={'ghost'}
                  size={'sm'}
                  onClick={onDelete}
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
