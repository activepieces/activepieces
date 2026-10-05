import {
  AppConnectionScope,
  PlatformAppConnectionsListItem,
} from '@activepieces/shared';
import { t } from 'i18next';
import { RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

import { CopyButton } from '@/components/custom/clipboard/copy-button';
import { Fact, FactList } from '@/components/custom/fact-list';
import { DefaultTag } from '@/components/custom/global-connection-utils';
import { listFormat } from '@/components/custom/list/list-format';
import { RowMenuItem } from '@/components/custom/list/row-menu';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { PieceIcon } from '@/features/pieces/components/piece-icon';
import { piecesHooks } from '@/features/pieces/hooks/pieces-hooks';
import { getProjectName } from '@/features/projects';
import { projectConnectionsPath } from '@/lib/route-utils';

import { ConnectionStatus, ownerLabel } from './connection-cells';

export function ConnectionSheet({
  connection,
  actions,
  onTest,
  onOpenChange,
}: {
  connection: PlatformAppConnectionsListItem | null;
  actions: RowMenuItem[];
  onTest: (connection: PlatformAppConnectionsListItem) => void;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={connection !== null} onOpenChange={onOpenChange}>
      <SheetContent
        size="sm"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        {connection && (
          <ConnectionContent
            connection={connection}
            actions={actions}
            onTest={() => onTest(connection)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function ConnectionContent({
  connection,
  actions,
  onTest,
}: {
  connection: PlatformAppConnectionsListItem;
  actions: RowMenuItem[];
  onTest: () => void;
}) {
  const { summary } = piecesHooks.usePieceSummary({
    name: connection.pieceName,
  });
  const isGlobal = connection.scope === AppConnectionScope.PLATFORM;
  const visible = actions.filter((action) => !action.hidden);
  const hiddenFlows = connection.flowCount - connection.flows.length;
  return (
    <>
      <SheetHeader className="flex-row items-center gap-3">
        <PieceIcon
          size="md"
          border
          displayName={summary?.displayName}
          logoUrl={summary?.logoUrl}
          showTooltip={false}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <SheetTitle className="truncate">{connection.displayName}</SheetTitle>
          <SheetDescription className="truncate">
            {[
              summary?.displayName ?? connection.pieceName,
              isGlobal ? t('Global') : t('Project connection'),
            ].join(' · ')}
          </SheetDescription>
        </div>
      </SheetHeader>
      <SheetBody>
        <FactList>
          <Fact label={t('Status')}>
            <span className="flex items-center justify-end gap-3">
              <ConnectionStatus status={connection.status} />
              <Button variant="outline" size="xs" onClick={onTest}>
                <RefreshCw />
                {t('Test')}
              </Button>
            </span>
          </Fact>
          <Fact label={isGlobal ? t('Shared with') : t('Project')}>
            {isGlobal ? (
              <span className="flex flex-wrap items-center justify-end gap-2">
                {connection.projects.length === 0
                  ? t('No projects')
                  : connection.projects
                      .map((project) => getProjectName(project))
                      .join(', ')}
                {connection.preSelectForNewProjects && <DefaultTag />}
              </span>
            ) : connection.projects[0] ? (
              <Link
                to={projectConnectionsPath(connection.projects[0].id)}
                className="hover:underline"
              >
                {getProjectName(connection.projects[0])}
              </Link>
            ) : (
              '—'
            )}
          </Fact>
          <Fact label={t('Owner')}>
            {ownerLabel({ owner: connection.owner })}
          </Fact>
          <Fact label={t('External ID')}>
            <span className="flex min-w-0 items-center justify-end gap-1">
              <span className="truncate font-mono text-xs">
                {connection.externalId}
              </span>
              <CopyButton
                textToCopy={connection.externalId}
                variant="ghost"
                size="icon-xs"
                aria-label={t('Copy external ID')}
              />
            </span>
          </Fact>
          <Fact label={t('Created')}>
            {listFormat.dateTime(connection.created)}
          </Fact>
          <Fact label={t('Updated')}>
            {listFormat.relativeDate(connection.updated)}
          </Fact>
        </FactList>
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-gray-12">
            {connection.flowCount === 0
              ? t('Not used by any flow')
              : t(
                  '{count, plural, =1 {Used by 1 flow} other {Used by # flows}}',
                  { count: connection.flowCount },
                )}
          </h3>
          {connection.flows.length > 0 && (
            <ul className="flex flex-col rounded-xl border">
              {connection.flows.map((flow) => (
                <li
                  key={flow.id}
                  className="truncate border-t px-3 py-2 text-sm first:border-t-0"
                >
                  {flow.displayName}
                </li>
              ))}
              {hiddenFlows > 0 && (
                <li className="border-t px-3 py-2 text-sm text-gray-11">
                  {t('and {count} more', { count: hiddenFlows })}
                </li>
              )}
            </ul>
          )}
        </section>
      </SheetBody>
      {visible.length > 0 && (
        <SheetFooter className="sm:justify-start">
          {visible.map((action) => (
            <Button
              key={action.label}
              variant={action.destructive ? 'destructive' : 'outline'}
              disabled={action.disabled}
              onClick={action.onSelect}
              className={action.destructive ? 'sm:ml-auto' : undefined}
            >
              {action.icon && <action.icon />}
              {action.label}
            </Button>
          ))}
        </SheetFooter>
      )}
    </>
  );
}
