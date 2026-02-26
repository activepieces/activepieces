import { SecretManagerProviderMetaData } from '@activepieces/shared';
import { t } from 'i18next';
import { Pencil, Trash } from 'lucide-react';

import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { secretManagersHooks } from '@/features/secret-managers/lib/secret-managers-hooks';

import ConnectSecretManagerDialog from './connect-secret-manager-dialog';

type SecretManagerProviderCardProps = {
  provider: SecretManagerProviderMetaData;
};

const SecretManagerProviderCard = ({
  provider,
}: SecretManagerProviderCardProps) => {
  const { mutate: disconnect, isPending } =
    secretManagersHooks.useDisconnectSecretManager();

  return (
    <Card className="w-full flex justify-between items-center px-4 py-4">
      <div className="flex gap-8 items-center">
        <img className="w-10" src={provider.logo} alt={provider.name} />
        <div>
          <div className="text-lg">{provider.name}</div>
          <div className="text-sm text-muted-foreground">
            {t('Configure credentials for {managerName} secret manager.', {
              managerName: provider.name,
            })}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <ConnectSecretManagerDialog manager={provider}>
          <Button variant={'ghost'} size={'sm'}>
            {provider.connected ? <Pencil className="size-4" /> : t('Connect')}
          </Button>
        </ConnectSecretManagerDialog>
        {provider.connected && (
          <ConfirmationDeleteDialog
            title={t('Disconnect Secret Manager')}
            message={t(
              'Are you sure you want to disconnect this secret manager?',
            )}
            entityName={provider.name}
            mutationFn={async () => disconnect({ providerId: provider.id })}
          >
            <Button variant={'ghost'} size={'sm'} loading={isPending}>
              <Trash className="size-4 text-destructive" />
            </Button>
          </ConfirmationDeleteDialog>
        )}
      </div>
    </Card>
  );
};

export default SecretManagerProviderCard;
