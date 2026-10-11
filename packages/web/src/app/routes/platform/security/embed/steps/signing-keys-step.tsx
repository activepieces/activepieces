import { SigningKey } from '@activepieces/shared';
import { t } from 'i18next';
import { Key, MoreHorizontal, Trash } from 'lucide-react';

import {
  AdminEmpty,
  AdminQueryState,
  ConfirmDialog,
  SettingsRow,
  useAdminAction,
} from '@/app/components/admin';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SkeletonList } from '@/components/ui/skeleton';
import { NewSigningKeyDialog, signingKeyApi } from '@/features/platform-admin';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { formatUtils } from '@/lib/format-utils';

import { StepShell } from '../stepper';

export const SigningKeysStep = ({
  signingKeys,
  isLoading,
  isError,
  refetch,
}: {
  signingKeys: SigningKey[];
  isLoading: boolean;
  isError: boolean;
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
      <AdminQueryState
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        entity={t('signing keys')}
        skeleton={
          <div className="p-5">
            <SkeletonList numberOfItems={3} className="w-full h-[72px]" />
          </div>
        }
      >
        <SigningKeysList signingKeys={signingKeys} refetch={refetch} />
      </AdminQueryState>
    </StepShell>
  );
};

const SigningKeysList = ({
  signingKeys,
  refetch,
}: {
  signingKeys: SigningKey[];
  refetch: () => void;
}) => {
  const deleteKey = useAdminAction<SigningKey>({
    verb: 'delete',
    name: (signingKey) => signingKey.displayName,
    run: async (signingKey) => {
      await signingKeyApi.delete(signingKey.id);
      refetch();
    },
  });

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
              <ConfirmDialog
                title={t('Delete {name}?', { name: signingKey.displayName })}
                description={t(
                  'Deleting this signing key will invalidate any tokens signed with it.',
                )}
                confirmLabel={t('Delete key')}
                onConfirm={() => deleteKey.mutateAsync(signingKey)}
                controlId={AdminControl.EMBEDDING_SIGNING_KEY_DELETE_CONFIRM}
              >
                <DropdownMenuItem
                  {...adminControl(
                    AdminControl.EMBEDDING_SIGNING_KEY_DELETE_OPEN,
                  )}
                  variant="destructive"
                  onSelect={(e) => e.preventDefault()}
                >
                  <Trash />
                  {t('Delete Signing Key')}
                </DropdownMenuItem>
              </ConfirmDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </SettingsRow>
      ))}
    </>
  );
};
