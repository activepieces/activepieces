import { PlatformAppConnectionsListItem } from '@activepieces/shared';
import { t } from 'i18next';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Fact, FactList } from '@/components/custom/fact-list';
import { listFormat } from '@/components/custom/list/list-format';
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

import { ConnectionStatus, ownerLabel } from './connection-cells';

export function ProjectConnectionSheet({
  connection,
  onOpenChange,
}: {
  connection: PlatformAppConnectionsListItem | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={connection !== null} onOpenChange={onOpenChange}>
      <SheetContent size="sm">
        {connection && <ProjectConnectionContent connection={connection} />}
      </SheetContent>
    </Sheet>
  );
}

function ProjectConnectionContent({
  connection,
}: {
  connection: PlatformAppConnectionsListItem;
}) {
  const { summary } = piecesHooks.usePieceSummary({
    name: connection.pieceName,
  });
  const project = connection.projects[0];
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
            {summary?.displayName ?? connection.pieceName}
          </SheetDescription>
        </div>
      </SheetHeader>
      <SheetBody>
        <p className="text-sm text-gray-11">
          {t(
            'This connection belongs to one project. Its members manage it there.',
          )}
        </p>
        <FactList>
          <Fact label={t('Status')}>
            <ConnectionStatus status={connection.status} />
          </Fact>
          <Fact label={t('Project')}>
            {project ? getProjectName(project) : '—'}
          </Fact>
          <Fact label={t('Owner')}>
            {ownerLabel({ owner: connection.owner })}
          </Fact>
          <Fact label={t('External ID')}>
            <span className="font-mono">{connection.externalId}</span>
          </Fact>
          <Fact label={t('Created')}>
            {listFormat.dateTime(connection.created)}
          </Fact>
          <Fact label={t('Updated')}>
            {listFormat.relativeDate(connection.updated)}
          </Fact>
        </FactList>
      </SheetBody>
      {project && (
        <SheetFooter>
          <Button variant="outline" className="w-full" asChild>
            <Link to={`/projects/${project.id}/connections`}>
              <ArrowUpRight />
              {t('Open in project')}
            </Link>
          </Button>
        </SheetFooter>
      )}
    </>
  );
}
