import { SigningKey } from '@activepieces/shared';
import { t } from 'i18next';
import { Key, MoreHorizontal, Trash } from 'lucide-react';

import { AdminEmpty, SettingsRow } from '@/app/components/admin';
import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SkeletonList } from '@/components/ui/skeleton';
import { internalErrorToast } from '@/components/ui/sonner';
import { NewSigningKeyDialog, signingKeyApi } from '@/features/platform-admin';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { formatUtils } from '@/lib/format-utils';

import { StepShell } from '../stepper';

export const SigningKeysStep = ({
  signingKeys,
  isLoading,
  refetch,
}: {
  signingKeys: SigningKey[];
  isLoading: boolean;
  refetch: () => void;
}) => {
  return (
    <StepShell
      title={t('Add signing keys')}
      description={t(
        "Generate a key to sign each embed session. We'll use the public half to verify your users at runtime.",
      )}
      actions={
        <NewSigningKeyDialog onCreate={refetch}>
          <Button
            {...adminControl(AdminControl.EMBEDDING_SIGNING_KEY_NEW_OPEN)}
          >
            {t('New Signing Key')}
          </Button>
        </NewSigningKeyDialog>
      }
      flush
    >
      <SigningKeysList
        signingKeys={signingKeys}
        isLoading={isLoading}
        refetch={refetch}
      />
    </StepShell>
  );
};

const SigningKeysList = ({
  signingKeys,
  isLoading,
  refetch,
}: {
  signingKeys: SigningKey[];
  isLoading: boolean;
  refetch: () => void;
}) => {
  if (isLoading) {
    return (
      <div className="p-5">
        <SkeletonList numberOfItems={3} className="w-full h-[72px]" />
      </div>
    );
  }

  if (signingKeys.length === 0) {
    return (
      <AdminEmpty
        framed={false}
        icon={<Key />}
        title={t('No signing keys yet')}
      />
    );
  }

  return (
    <>
      {signingKeys.map((signingKey) => (
        <SettingsRow
          key={signingKey.id}
          icon={<Key />}
          title={signingKey.displayName}
          description={
            <div className="flex flex-col text-xs">
              <span>
                {t('Created')}{' '}
                {formatUtils.formatDateToAgo(new Date(signingKey.created))}
              </span>
              <span>kid: {signingKey.id}</span>
            </div>
          }
        >
          <DropdownMenu modal={true}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={t('Actions')}>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <ConfirmationDeleteDialog
                title={t('Delete Signing Key')}
                message={t(
                  'Deleting this signing key will invalidate any tokens signed with it.',
                )}
                entityName={t('Signing Key')}
                buttonText={t('Delete')}
                mutationFn={async () => {
                  await signingKeyApi.delete(signingKey.id);
                  refetch();
                }}
                onError={() => internalErrorToast()}
                controlId={AdminControl.EMBEDDING_SIGNING_KEY_DELETE_CONFIRM}
              >
                <DropdownMenuItem
                  {...adminControl(
                    AdminControl.EMBEDDING_SIGNING_KEY_DELETE_OPEN,
                  )}
                  className="text-danger-11 focus:text-danger-11"
                  onSelect={(e) => e.preventDefault()}
                >
                  <Trash className="text-danger-11" />
                  {t('Delete Signing Key')}
                </DropdownMenuItem>
              </ConfirmationDeleteDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </SettingsRow>
      ))}
    </>
  );
};
