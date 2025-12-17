import { t } from 'i18next';
import { Pencil, Trash } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AIProviderName } from '@activepieces/shared';

import { UpsertAIProviderDialog } from './upsert-provider-dialog';

type AIProviderCardProps = {
  logoUrl: string;
  provider: AIProviderName;
  displayName: string;
  markdown: string;
  configured: boolean;
  onDelete: () => void;
  onSave: () => void;
  isDeleting: boolean;
  allowWrite?: boolean;
};

const AIProviderCard = ({
  logoUrl,
  displayName,
  markdown,
  provider,
  configured,
  onDelete,
  isDeleting,
  onSave,
  allowWrite = true,
}: AIProviderCardProps) => {
  return (
    <Card className="w-full px-4 py-4">
      <div className="flex w-full gap-2 justify-center items-center">
        <div className="flex flex-col gap-2 text-center mr-2">
          <img src={logoUrl} alt="icon" width={32} height={32} />
        </div>
        <div className="flex grow flex-col">
          <div className="text-lg flex items-center">{displayName}</div>
          {allowWrite && (
            <div className="text-sm text-muted-foreground">
              {t('Configure credentials for {providerName} AI provider.', {
                providerName: displayName,
              })}
            </div>
          )}
        </div>
        {allowWrite && (
          <div className="flex flex-row justify-center items-center gap-1">
            <UpsertAIProviderDialog
              provider={provider}
              configured={configured}
              logoUrl={logoUrl}
              displayName={displayName}
              markdown={markdown}
              onSave={onSave}
            >
              <Button variant={configured ? 'ghost' : 'basic'} size={'sm'}>
                {configured ? <Pencil className="size-4" /> : t('Enable')}
              </Button>
            </UpsertAIProviderDialog>
            {configured && (
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
