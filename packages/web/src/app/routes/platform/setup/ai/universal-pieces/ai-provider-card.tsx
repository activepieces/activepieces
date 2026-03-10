import { AIProviderWithoutSensitiveData } from '@activepieces/shared';
import { t } from 'i18next';
import { Pencil, Trash } from 'lucide-react';

import {
  Item,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
} from '@/components/custom/item';
import { ItemMediaImage } from '@/components/custom/item-media-image';
import { Button } from '@/components/ui/button';
import { AiProviderInfo } from '@/features/agents';

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
    <Item variant="outline">
      {logoUrl && <ItemMediaImage src={logoUrl} alt={providerInfo.name} />}
      <ItemContent>
        <ItemTitle>{providerConfig?.name ?? providerInfo.name}</ItemTitle>
        {allowWrite && (
          <ItemDescription>
            {t('Configure credentials for {providerName} AI provider.', {
              providerName: providerInfo.name,
            })}
          </ItemDescription>
        )}
      </ItemContent>
      {allowWrite && (
        <ItemActions>
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
              <Button variant={'basic'} size={'sm'}>
                {t('Enable')}
              </Button>
            )}
          </UpsertAIProviderDialog>
          {providerConfig && (
            <Button
              variant={'ghost'}
              size={'sm'}
              onClick={() => onDelete(providerConfig.id)}
              loading={isDeleting}
              disabled={isDeleting}
            >
              <Trash className="size-4 text-destructive" />
            </Button>
          )}
        </ItemActions>
      )}
    </Item>
  );
};

AIProviderCard.displayName = 'AIProviderCard';
export { AIProviderCard };
