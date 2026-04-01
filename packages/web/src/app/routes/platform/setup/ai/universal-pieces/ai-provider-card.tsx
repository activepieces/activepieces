import { AIProviderWithoutSensitiveData } from '@activepieces/shared';
import { t } from 'i18next';
import { Pencil, Trash } from 'lucide-react';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
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
  onDelete: (id: string) => Promise<void>;
  onSave: () => void;
  allowWrite?: boolean;
};

const AIProviderCard = ({
  providerInfo,
  providerConfig,
  onDelete,
  onSave,
  allowWrite = true,
}: AIProviderCardProps) => {
  const logoUrl = providerInfo.logoUrl;
  const displayName = providerConfig?.name ?? providerInfo.name;

  return (
    <Item variant="outline">
      {logoUrl && <ItemMediaImage src={logoUrl} alt={providerInfo.name} />}
      <ItemContent>
        <ItemTitle>{displayName}</ItemTitle>
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
            defaultDisplayName={displayName}
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
            <ConfirmationDeleteDialog
              title={t('Delete AI Provider')}
              message={t('Are you sure you want to delete {providerName}?', {
                providerName: displayName,
              })}
              warning={t(
                'All steps using this AI provider will fail after deletion.',
              )}
              entityName={displayName}
              mutationFn={() => onDelete(providerConfig.id)}
            >
              <Button variant={'ghost'} size={'sm'}>
                <Trash className="size-4 text-destructive" />
              </Button>
            </ConfirmationDeleteDialog>
          )}
        </ItemActions>
      )}
    </Item>
  );
};

AIProviderCard.displayName = 'AIProviderCard';
export { AIProviderCard };
