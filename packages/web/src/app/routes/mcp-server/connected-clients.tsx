import { McpOAuthClientRow } from '@activepieces/shared';
import { t } from 'i18next';
import { ArrowLeft, Plug, Unplug } from 'lucide-react';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/custom/empty';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@/components/custom/item';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Button } from '@/components/ui/button';
import { SkeletonList } from '@/components/ui/skeleton';
import { formatUtils } from '@/lib/format-utils';

import { ClientIcon } from './connect-steps';
import { mcpClientIdentity } from './mcp-client-identity';
import { mcpClientsMutations, mcpClientsQueries } from './mcp-clients-hooks';

export function ConnectedClients({ onBack }: { onBack: () => void }) {
  const { rows, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    mcpClientsQueries.useMyClients();
  const revoke = mcpClientsMutations.useRevokeMine();

  return (
    <div className="mx-auto flex w-full max-w-[1198px] flex-col gap-5 bg-background px-6 py-8 lg:px-12">
      <button
        type="button"
        onClick={onBack}
        className="flex w-fit items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-[15px]" />
        {t('Back')}
      </button>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[26px] font-bold leading-8 tracking-[-0.025em]">
          {t('Your connected clients')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('Every client you have signed in, across all your projects.')}
        </p>
      </div>

      {isLoading && <SkeletonList numberOfItems={3} className="h-[72px]" />}

      {!isLoading && rows.length === 0 && (
        <Empty className="border border-dashed py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Plug />
            </EmptyMedia>
            <EmptyTitle>{t('Nothing connected yet')}</EmptyTitle>
            <EmptyDescription>
              {t('The first client to use the link shows up here.')}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {!isLoading && rows.length > 0 && (
        <ItemGroup className="gap-2">
          {rows.map((row) => (
            <ClientRow
              key={row.id}
              row={row}
              onRevoke={() => revoke.mutateAsync([row.id])}
            />
          ))}
        </ItemGroup>
      )}

      {hasNextPage && (
        <Button
          variant="ghost"
          size="sm"
          className="self-start"
          loading={isFetchingNextPage}
          onClick={() => fetchNextPage()}
        >
          {t('Load more')}
        </Button>
      )}
    </div>
  );
}

function ClientRow({
  row,
  onRevoke,
}: {
  row: McpOAuthClientRow;
  onRevoke: () => Promise<void>;
}) {
  const label = mcpClientIdentity.label(row.clientKey, row.clientName);

  return (
    <Item variant="outline" size="sm">
      <ItemMedia>
        <ClientIcon icon={mcpClientIdentity.icon(row.clientKey)} />
      </ItemMedia>
      <ItemContent className="min-w-0">
        <TextWithTooltip tooltipMessage={label}>
          <ItemTitle className="truncate">{label}</ItemTitle>
        </TextWithTooltip>
        <ItemDescription className="text-xs">
          {scopeLabel(row)}
          {' · '}
          {row.lastUsedAt
            ? t('Last used {time}', {
                time: formatUtils.formatDateToAgo(new Date(row.lastUsedAt)),
              })
            : t('Waiting for first call')}
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <ConfirmationDeleteDialog
          title={t('Revoke access')}
          message={t(
            'This ends the grant for {label}. Access ends within 15 minutes, and the client will ask to sign in again.',
            { label },
          )}
          entityName={label}
          buttonText={t('Revoke')}
          isDanger
          mutationFn={onRevoke}
        >
          <Button
            variant="ghost"
            size="icon"
            className="size-9 shrink-0 text-muted-foreground hover:text-destructive"
            aria-label={t('Revoke access')}
          >
            <Unplug className="size-4" />
          </Button>
        </ConfirmationDeleteDialog>
      </ItemActions>
    </Item>
  );
}

function scopeLabel(row: McpOAuthClientRow): string {
  return row.projectName ?? t('All projects');
}
