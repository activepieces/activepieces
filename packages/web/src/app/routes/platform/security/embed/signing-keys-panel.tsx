import { SigningKey } from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { Download, Key, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { CopyButton } from '@/components/custom/clipboard/copy-button';
import { ConfirmDialog } from '@/components/custom/confirm-dialog';
import { DataTable, RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import {
  DateCell,
  MutedCell,
  NameCell,
} from '@/components/custom/list/list-cells';
import { RowMenu } from '@/components/custom/list/row-menu';
import { PageSection } from '@/components/custom/page';
import { Button } from '@/components/ui/button';
import { internalErrorToast } from '@/components/ui/sonner';
import { NewSigningKeyDialog, signingKeyApi } from '@/features/platform-admin';

export const SigningKeysPanel = ({
  signingKeys,
  isLoading,
  isError,
  refetch,
}: SigningKeysPanelProps) => {
  const [deleting, setDeleting] = useState<SigningKey | null>(null);
  const newKeyButton = (
    <NewSigningKeyDialog onCreate={refetch}>
      <Button variant="outline">
        <Plus />
        {t('New signing key')}
      </Button>
    </NewSigningKeyDialog>
  );

  const columns: ColumnDef<RowDataWithActions<SigningKey>>[] = [
    {
      accessorKey: 'displayName',
      size: 400,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Key')} />
      ),
      cell: ({ row }) => (
        <NameCell
          stacked
          title={row.original.displayName}
          sub={
            <span className="flex min-w-0 items-center gap-1">
              <span className="truncate font-mono">{row.original.id}</span>
              <CopyButton
                textToCopy={row.original.id}
                variant="ghost"
                size="icon-xs"
                tooltipSide="right"
              />
            </span>
          }
        />
      ),
    },
    {
      accessorKey: 'algorithm',
      size: 120,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Algorithm')} />
      ),
      cell: ({ row }) => <MutedCell>{row.original.algorithm}</MutedCell>,
    },
    {
      accessorKey: 'created',
      size: 120,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Created')} />
      ),
      cell: ({ row }) => <DateCell value={row.original.created} mode="short" />,
    },
    {
      id: 'actions',
      size: 56,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <RowMenu
            items={[
              {
                label: t('Download public key'),
                icon: Download,
                onSelect: () => downloadPublicKey(row.original),
              },
              {
                label: t('Delete'),
                icon: Trash2,
                destructive: true,
                onSelect: () => setDeleting(row.original),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <PageSection
      title={t('Signing keys')}
      description={t(
        'Your app signs a short-lived token with the private key; the public half here lets the user in.',
      )}
      action={signingKeys.length > 0 ? newKeyButton : undefined}
    >
      <DataTable
        columns={columns}
        page={{ data: signingKeys, next: null, previous: null }}
        isLoading={isLoading}
        isError={isError}
        errorStateEntity={t('signing keys')}
        onRetry={refetch}
        hidePagination
        emptyStateTextTitle={t('No signing keys yet')}
        emptyStateTextDescription={t(
          'Create one and your app can sign a token that lets a user straight into the builder.',
        )}
        emptyStateIcon={<Key />}
        emptyStateAction={newKeyButton}
      />
      {deleting && (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setDeleting(null)}
          title={t('Delete {name}?', { name: deleting.displayName })}
          description={t(
            'Anything signing tokens with this key stops being able to sign users in.',
          )}
          consequence={t('Every token signed with it is rejected immediately.')}
          confirmLabel={t('Delete')}
          typeToConfirm={deleting.displayName}
          onConfirm={async () => {
            await signingKeyApi.delete(deleting.id);
            refetch();
          }}
          onError={() => internalErrorToast()}
        />
      )}
    </PageSection>
  );
};

function downloadPublicKey(signingKey: SigningKey) {
  const blob = new Blob([signingKey.publicKey], {
    type: 'application/x-pem-file',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${signingKey.displayName}.pub.pem`;
  anchor.click();
  URL.revokeObjectURL(url);
}

type SigningKeysPanelProps = {
  signingKeys: SigningKey[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
};
