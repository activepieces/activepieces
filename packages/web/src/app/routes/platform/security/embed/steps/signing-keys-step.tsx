import { SigningKey } from '@activepieces/shared';
import { t } from 'i18next';
import { Key, MoreHorizontal, Trash } from 'lucide-react';

import { ConfirmDialog } from '@/components/custom/confirm-dialog';
import { Panel } from '@/components/custom/panel';
import { SkeletonList } from '@/components/custom/skeleton-list';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from '@/components/ui/empty';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item';
import { internalErrorToast } from '@/components/ui/sonner';
import { NewSigningKeyDialog, signingKeyApi } from '@/features/platform-admin';
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
          <Button>{t('New Signing Key')}</Button>
        </NewSigningKeyDialog>
      }
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
    return <SkeletonList numberOfItems={3} className="h-14 rounded-2xl" />;
  }

  if (signingKeys.length === 0) {
    return (
      <Panel flush>
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Key />
            </EmptyMedia>
            <EmptyDescription>{t('No signing keys yet')}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </Panel>
    );
  }

  return (
    <Panel flush>
      <ItemGroup className="px-1">
        {signingKeys.map((signingKey) => (
          <Item key={signingKey.id}>
            <ItemMedia variant="icon">
              <Key />
            </ItemMedia>
            <ItemContent className="min-w-0">
              <ItemTitle>{signingKey.displayName}</ItemTitle>
              <ItemDescription>
                {t('Created')}{' '}
                {formatUtils.formatDateToAgo(new Date(signingKey.created))}
                <br />
                <span className="font-mono">kid: {signingKey.id}</span>
              </ItemDescription>
            </ItemContent>
            <ItemActions>
              <DropdownMenu modal={true}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm">
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <ConfirmDialog
                    title={t('Delete {name}?', {
                      name: signingKey.displayName,
                    })}
                    description={t('This action cannot be undone.')}
                    consequence={t(
                      'Deleting this signing key will invalidate any tokens signed with it.',
                    )}
                    confirmLabel={t('Delete')}
                    typeToConfirm={signingKey.displayName}
                    onConfirm={async () => {
                      await signingKeyApi.delete(signingKey.id);
                      refetch();
                    }}
                    onError={() => internalErrorToast()}
                  >
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <Trash />
                      {t('Delete Signing Key')}
                    </DropdownMenuItem>
                  </ConfirmDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </ItemActions>
          </Item>
        ))}
      </ItemGroup>
    </Panel>
  );
};
