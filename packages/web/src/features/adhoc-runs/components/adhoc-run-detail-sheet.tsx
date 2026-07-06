import { isNil } from '@activepieces/core-utils';
import {
  AdhocRunKind,
  FlowActionType,
  FlowRunStatus,
  isFailedState,
  PopulatedAdhocRun,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Fragment } from 'react';

import { FormattedDate } from '@/components/custom/formatted-date';
import { SimpleJsonViewer } from '@/components/custom/simple-json-viewer';
import { StatusIconWithText } from '@/components/custom/status-icon-with-text';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { flowRunUtils } from '@/features/flow-runs/utils/flow-run-utils';
import { PieceIcon, PieceIconWithPieceName } from '@/features/pieces';
import { piecesHooks } from '@/features/pieces/hooks/pieces-hooks';
import { CORE_STEP_METADATA } from '@/features/pieces/utils/step-utils';
import { formatUtils } from '@/lib/format-utils';

import { formatSource } from './adhoc-runs-columns';

export const AdhocRunDetailSheet = ({
  run,
  open,
  onOpenChange,
}: AdhocRunDetailSheetProps) => {
  const { variant, Icon } = flowRunUtils.getStatusIcon(
    run?.status ?? FlowRunStatus.RUNNING,
  );
  const failed = !isNil(run) && isFailedState(run.status);
  const { pieceModel } = piecesHooks.usePiece({
    name: run?.pieceName ?? '',
    enabled: run?.kind === AdhocRunKind.PIECE && !isNil(run?.pieceName),
  });
  const actionName = run?.actionName ?? null;
  const pieceDisplayName = pieceModel?.displayName ?? run?.pieceName ?? null;
  const actionDisplayName = isNil(actionName)
    ? null
    : pieceModel?.actions?.[actionName]?.displayName ?? actionName;
  const overview = isNil(run)
    ? []
    : buildOverviewRows({ run, pieceDisplayName, actionDisplayName });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[520px] sm:max-w-[520px] flex flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b shrink-0">
          <SheetTitle className="text-base flex items-center gap-2">
            {!isNil(run) && run.kind === AdhocRunKind.CODE && (
              <PieceIcon
                size="sm"
                border={true}
                showTooltip={false}
                displayName={t('Code')}
                logoUrl={CORE_STEP_METADATA[FlowActionType.CODE].logoUrl}
              />
            )}
            {!isNil(run) &&
              run.kind === AdhocRunKind.PIECE &&
              !isNil(run.pieceName) && (
                <PieceIconWithPieceName
                  pieceName={run.pieceName}
                  size="sm"
                  showTooltip={false}
                />
              )}
            {buildTitle({ run, pieceDisplayName, actionDisplayName })}
          </SheetTitle>
          {!isNil(run) && (
            <div className="mt-1">
              <StatusIconWithText
                icon={Icon}
                text={formatUtils.convertEnumToReadable(run.status)}
                variant={variant}
              />
            </div>
          )}
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 flex flex-col gap-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {t('Overview')}
            </p>
            <div className="grid grid-cols-[150px_1fr] gap-y-3 text-sm">
              {overview.map(({ label, value }) => (
                <Fragment key={label}>
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium break-words">{value}</span>
                </Fragment>
              ))}
            </div>
          </div>

          <Separator />
          <div className="px-6 py-5 flex flex-col gap-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {t('Input')}
            </p>
            <SimpleJsonViewer data={run?.input ?? {}} />
          </div>

          {failed && !isNil(run?.errorMessage) && (
            <>
              <Separator />
              <div className="px-6 py-5 flex flex-col gap-4">
                <p className="text-xs font-semibold text-destructive uppercase tracking-wide">
                  {t('Error')}
                </p>
                <pre className="whitespace-pre-wrap break-all text-sm text-destructive">
                  {run.errorMessage}
                </pre>
              </div>
            </>
          )}

          {!isNil(run?.output) && (
            <>
              <Separator />
              <div className="px-6 py-5 flex flex-col gap-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {t('Output')}
                </p>
                <SimpleJsonViewer data={run.output} />
              </div>
            </>
          )}

          {!isNil(run?.logs) && (
            <>
              <Separator />
              <div className="px-6 py-5 flex flex-col gap-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {t('Logs')}
                </p>
                <pre className="whitespace-pre-wrap break-all text-sm text-muted-foreground">
                  {run.logs}
                </pre>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

function buildTitle({
  run,
  pieceDisplayName,
  actionDisplayName,
}: BuildParams & { run: PopulatedAdhocRun | null }): string {
  if (isNil(run)) {
    return t('Run Details');
  }
  if (run.kind === AdhocRunKind.CODE) {
    return t('Code');
  }
  return actionDisplayName ?? pieceDisplayName ?? t('Run Details');
}

function buildOverviewRows({
  run,
  pieceDisplayName,
  actionDisplayName,
}: BuildParams & { run: PopulatedAdhocRun }): OverviewRow[] {
  const duration =
    run.startTime && run.finishTime
      ? formatUtils.formatDuration(
          new Date(run.finishTime).getTime() -
            new Date(run.startTime).getTime(),
        )
      : '—';

  const rows: OverviewRow[] = [
    {
      label: t('Source'),
      value: formatSource(run.source),
    },
  ];
  if (run.kind === AdhocRunKind.PIECE && !isNil(pieceDisplayName)) {
    rows.push({ label: t('Piece'), value: pieceDisplayName });
  }
  if (!isNil(actionDisplayName)) {
    rows.push({ label: t('Action'), value: actionDisplayName });
  }
  const connectionLabel = run.connectionDisplayName ?? run.connectionExternalId;
  if (!isNil(connectionLabel)) {
    rows.push({
      label: t('Connection'),
      value: connectionLabel,
    });
  }
  if (!isNil(run.userName)) {
    rows.push({
      label: t('Run By'),
      value: run.userName,
    });
  }
  rows.push(
    {
      label: t('Started At'),
      value: <FormattedDate date={new Date(run.created)} includeTime={true} />,
    },
    { label: t('Duration'), value: duration },
  );
  return rows;
}

type AdhocRunDetailSheetProps = {
  run: PopulatedAdhocRun | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type OverviewRow = {
  label: string;
  value: React.ReactNode;
};

type BuildParams = {
  pieceDisplayName: string | null;
  actionDisplayName: string | null;
};
