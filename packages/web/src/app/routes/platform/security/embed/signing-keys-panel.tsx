import { SigningKey } from '@activepieces/shared';
import dayjs from 'dayjs';
import { t } from 'i18next';
import {
  Copy,
  Download,
  Key,
  MoreHorizontal,
  Plus,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { CopyButton } from '@/components/custom/clipboard/copy-button';
import { ConfirmDialog } from '@/components/custom/confirm-dialog';
import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { Panel } from '@/components/custom/panel';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { internalErrorToast } from '@/components/ui/sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { NewSigningKeyDialog, signingKeyApi } from '@/features/platform-admin';

export const SigningKeysPanel = ({
  signingKeys,
  isLoading,
  isError,
  refetch,
}: SigningKeysPanelProps) => {
  return (
    <Panel
      title={t('Signing keys')}
      description={t(
        'Your app signs a short-lived token with the private key, and the public half signs the user in.',
      )}
      action={
        <NewSigningKeyDialog onCreate={refetch}>
          <Button>
            <Plus />
            {t('New signing key')}
          </Button>
        </NewSigningKeyDialog>
      }
      flush
    >
      {isLoading ? (
        <div className="flex flex-col gap-2 p-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : isError ? (
        <DataFetchErrorState entity={t('signing keys')} onRetry={refetch} />
      ) : signingKeys.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Key />
            </EmptyMedia>
            <EmptyTitle>{t('No signing keys yet')}</EmptyTitle>
            <EmptyDescription>
              {t(
                'Create one and your app can sign a token that lets a user straight into the builder.',
              )}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>{t('Key')}</TableHead>
              <TableHead className="w-28">{t('Algorithm')}</TableHead>
              <TableHead className="w-28">{t('Created')}</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {signingKeys.map((signingKey) => (
              <SigningKeyRow
                key={signingKey.id}
                signingKey={signingKey}
                refetch={refetch}
              />
            ))}
          </TableBody>
        </Table>
      )}
    </Panel>
  );
};

const SigningKeyRow = ({
  signingKey,
  refetch,
}: {
  signingKey: SigningKey;
  refetch: () => void;
}) => {
  const [deleteOpen, setDeleteOpen] = useState(false);

  const copyKeyId = async () => {
    await navigator.clipboard.writeText(signingKey.id);
    toast.success(t('Key ID copied'));
  };

  const downloadPublicKey = () => {
    const blob = new Blob([signingKey.publicKey], {
      type: 'application/x-pem-file',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${signingKey.displayName}.pub.pem`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <TableRow>
      <TableCell>
        <div className="flex min-w-0 flex-col">
          <TextWithTooltip tooltipMessage={signingKey.displayName}>
            <span className="truncate font-medium text-gray-12">
              {signingKey.displayName}
            </span>
          </TextWithTooltip>
          <div className="flex min-w-0 items-center gap-1">
            <span className="truncate font-mono text-xs text-gray-11">
              {signingKey.id}
            </span>
            <CopyButton
              textToCopy={signingKey.id}
              variant="ghost"
              size="icon-xs"
              tooltipSide="right"
            />
          </div>
        </div>
      </TableCell>
      <TableCell className="text-gray-11">{signingKey.algorithm}</TableCell>
      <TableCell className="text-gray-11">
        {formatCreated(signingKey.created)}
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t('More actions')}
            >
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => copyKeyId().catch(() => null)}>
              <Copy />
              {t('Copy key ID')}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={downloadPublicKey}>
              <Download />
              {t('Download public key')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setDeleteOpen(true)}
            >
              <Trash2 />
              {t('Delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <ConfirmDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          title={t('Delete {name}?', { name: signingKey.displayName })}
          description={t(
            'Anything signing tokens with this key stops being able to sign users in.',
          )}
          consequence={t('Every token signed with it is rejected immediately.')}
          confirmLabel={t('Delete')}
          typeToConfirm={signingKey.displayName}
          onConfirm={async () => {
            await signingKeyApi.delete(signingKey.id);
            refetch();
          }}
          onError={() => internalErrorToast()}
        />
      </TableCell>
    </TableRow>
  );
};

function formatCreated(created: string): string {
  const date = dayjs(created);
  return date.format(date.year() === dayjs().year() ? 'D MMM' : 'D MMM YYYY');
}

type SigningKeysPanelProps = {
  signingKeys: SigningKey[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
};
