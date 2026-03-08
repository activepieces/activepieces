import { SecretManagerProviderMetaData } from '@activepieces/shared';
import { t } from 'i18next';
import { CircleAlert, Pencil, RefreshCcw, Trash } from 'lucide-react';

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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { secretManagersHooks } from '@/features/secret-managers';

import ConnectSecretManagerDialog from './connect-secret-manager-dialog';

type SecretManagerProviderCardProps = {
  provider: SecretManagerProviderMetaData;
};

const SecretManagerProviderCard = ({
  provider,
}: SecretManagerProviderCardProps) => {
  const { mutate: disconnect, isPending: isDisconnecting } =
    secretManagersHooks.useDisconnectSecretManager();
  const { mutate: clearCache, isPending: isClearingCache } =
    secretManagersHooks.useClearCache();

  return (
    <Item variant="outline">
      <ItemMediaImage src={provider.logo} alt={provider.name} />
      <ItemContent>
        <ItemTitle>
          {provider.name}
          {provider.connection?.configured &&
            !provider.connection?.connected && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <CircleAlert className="size-4 text-destructive" />
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {t(
                    'Your configuration is not working, please try reconnecting',
                  )}
                </TooltipContent>
              </Tooltip>
            )}
        </ItemTitle>
        <ItemDescription>
          {t('Configure credentials for {managerName} secret manager.', {
            managerName: provider.name,
          })}
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <ConnectSecretManagerDialog manager={provider}>
          {provider.connection?.configured ? (
            <Button variant={'ghost'} size={'sm'}>
              <Pencil className="size-4" />
            </Button>
          ) : (
            <Button variant={'basic'} size={'sm'}>
              {t('Connect')}
            </Button>
          )}
        </ConnectSecretManagerDialog>
        {provider.connection?.configured && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={'ghost'}
                  size={'sm'}
                  loading={isClearingCache}
                  onClick={() => clearCache()}
                >
                  <RefreshCcw className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('Clear Cache')}</TooltipContent>
            </Tooltip>
            <ConfirmationDeleteDialog
              title={t('Disconnect Secret Manager')}
              message={t(
                'Disconnecting this secret manager will stop syncing secrets with the provider.',
              )}
              entityName={provider.name}
              buttonText={t('Disconnect')}
              mutationFn={async () => disconnect({ providerId: provider.id })}
            >
              <Button variant={'ghost'} size={'sm'} loading={isDisconnecting}>
                <Trash className="size-4 text-destructive" />
              </Button>
            </ConfirmationDeleteDialog>
          </>
        )}
      </ItemActions>
    </Item>
  );
};

export default SecretManagerProviderCard;
