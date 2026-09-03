import { PopulatedMcpActivity } from '@activepieces/shared';
import { t } from 'i18next';
import { Check, X } from 'lucide-react';

import { SimpleJsonViewer } from '@/components/custom/simple-json-viewer';
import { LoadingSpinner } from '@/components/custom/spinner';
import { StatusIconWithText } from '@/components/custom/status-icon-with-text';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { formatUtils } from '@/lib/format-utils';

import { mcpActivityQueries } from '../mcp-activity-hooks';
import { mcpClientDisplay } from '../mcp-client-display';

import { activityUtils } from './activity-utils';

export function ActivityDetailSheet({
  row,
  onClose,
  actionDisplayName,
  pieceDisplayName,
  currentUserId,
}: ActivityDetailSheetProps) {
  return (
    <Sheet open={row !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex w-[480px] flex-col p-0 sm:max-w-[480px]">
        {row !== null && (
          <ActivityDetail
            row={row}
            actionDisplayName={actionDisplayName}
            pieceDisplayName={pieceDisplayName}
            currentUserId={currentUserId}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function ActivityDetail({
  row,
  actionDisplayName,
  pieceDisplayName,
  currentUserId,
}: ActivityDetailProps) {
  const { action, piece } = activityUtils.formatRan({
    row,
    actionDisplayName,
    pieceDisplayName,
  });
  const memberName = row.member
    ? `${row.member.firstName} ${row.member.lastName}`.trim() ||
      row.member.email
    : null;

  return (
    <>
      <SheetHeader className="shrink-0 border-b px-6 py-4">
        <SheetTitle className="flex flex-wrap items-center gap-2">
          <span>{action}</span>
          {piece !== null && (
            <span className="font-normal text-muted-foreground">{piece}</span>
          )}
        </SheetTitle>
        <div className="flex items-center gap-3 pt-1">
          {row.status === 'SUCCEEDED' ? (
            <StatusIconWithText
              icon={Check}
              text={t('Succeeded')}
              variant="success"
            />
          ) : (
            <StatusIconWithText icon={X} text={t('Failed')} variant="error" />
          )}
          <span className="text-sm text-muted-foreground">
            {formatUtils.formatDuration(row.durationMs)}
          </span>
        </div>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        <dl className="flex flex-col gap-3 text-sm">
          <DetailRow
            label={t('When')}
            value={activityUtils.formatWhen(row.created)}
          />
          <DetailRow
            label={t('Client')}
            value={mcpClientDisplay.label({
              key: row.clientKey,
              clientName: null,
            })}
          />
          <DetailRow
            label={t('Member')}
            value={
              memberName === null
                ? null
                : row.member?.id === currentUserId
                ? t('{name} · you', { name: memberName })
                : memberName
            }
          />
          <DetailRow label={t('Project')} value={row.projectName} />
          <DetailRow
            label={t('Account')}
            value={activityUtils.formatAccount(row)}
          />
        </dl>

        {row.errorMessage !== null && (
          <div className="mt-5 rounded-md border border-destructive/30 bg-destructive/5 p-3">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-destructive">
              {t('Error')}
            </div>
            <pre className="whitespace-pre-wrap break-words text-xs text-destructive">
              {row.errorMessage}
            </pre>
          </div>
        )}

        {row.hasPayload ? (
          <ActivityPayload id={row.id} />
        ) : (
          <p className="mt-5 text-sm text-muted-foreground">
            {t('The input and output were not kept for this call.')}
          </p>
        )}
      </div>
    </>
  );
}

function ActivityPayload({ id }: { id: string }) {
  const { data, isLoading, isError } = mcpActivityQueries.usePayload({ id });

  if (isLoading) {
    return (
      <div className="mt-6 flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <p className="mt-5 text-sm text-muted-foreground">
        {t('The input and output are no longer available.')}
      </p>
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-5">
      {data.truncated && (
        <p className="text-xs text-muted-foreground">
          {t('Too large to keep in full — some of it was dropped.')}
        </p>
      )}
      <PayloadSection label={t('Input')} data={data.input} />
      <PayloadSection label={t('Output')} data={data.output} />
    </div>
  );
}

function PayloadSection({ label, data }: { label: string; data: unknown }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      {data === null || data === undefined ? (
        <div className="text-sm text-muted-foreground">—</div>
      ) : (
        <SimpleJsonViewer data={data} maxHeight={260} fontSize="12px" />
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex gap-4">
      <dt className="w-24 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{value ?? '—'}</dd>
    </div>
  );
}

type ActivityDetailSheetProps = {
  row: PopulatedMcpActivity | null;
  onClose: () => void;
  actionDisplayName: string | undefined;
  pieceDisplayName: string | undefined;
  currentUserId: string | undefined;
};

type ActivityDetailProps = {
  row: PopulatedMcpActivity;
  actionDisplayName: string | undefined;
  pieceDisplayName: string | undefined;
  currentUserId: string | undefined;
};
