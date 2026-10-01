import { PopulatedMcpActivity, ProjectType } from '@activepieces/shared';
import { t } from 'i18next';
import { Check, ChevronDown, ChevronUp, TriangleAlert, X } from 'lucide-react';
import React, { ReactNode, useRef } from 'react';

import { LogoPlate } from '@/components/custom/logo-plate';
import { SimpleJsonViewer } from '@/components/custom/simple-json-viewer';
import { LoadingSpinner } from '@/components/custom/spinner';
import { StatusIconWithText } from '@/components/custom/status-icon-with-text';
import { UserAvatar } from '@/components/custom/user-avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PieceIcon } from '@/features/pieces/components/piece-icon';
import { formatUtils } from '@/lib/format-utils';
import { cn } from '@/lib/utils';

import { ClientIcon } from '../client-icon';
import { mcpActivityQueries } from '../mcp-activity-hooks';
import { mcpClientDisplay } from '../mcp-client-display';

import { activityUtils, ParsedOutput } from './activity-utils';

export function ActivityDetailSheet({
  row,
  onClose,
  actionDisplayName,
  pieceDisplayName,
  pieceLogoUrl,
  currentUserId,
  projectType,
  onPrevious,
  onNext,
}: ActivityDetailSheetProps) {
  const focusTargetRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (
      event.target instanceof Element &&
      event.target.closest('[data-activity-body]') !== null
    ) {
      return;
    }
    if (event.key === 'ArrowUp' && onPrevious) {
      event.preventDefault();
      onPrevious();
    }
    if (event.key === 'ArrowDown' && onNext) {
      event.preventDefault();
      onNext();
    }
  };

  return (
    <Sheet open={row !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        size="sm"
        showCloseButton={false}
        overlayClassName="bg-scrim/40"
        onKeyDown={handleKeyDown}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          focusTargetRef.current?.focus();
        }}
      >
        {row !== null && (
          <ActivityDetail
            key={row.id}
            row={row}
            actionDisplayName={actionDisplayName}
            pieceDisplayName={pieceDisplayName}
            pieceLogoUrl={pieceLogoUrl}
            currentUserId={currentUserId}
            projectType={projectType}
            controls={
              <div
                ref={focusTargetRef}
                tabIndex={-1}
                className="flex shrink-0 items-center gap-1 outline-hidden"
              >
                <NavButton
                  label={t('Previous')}
                  shortcut="↑"
                  icon={ChevronUp}
                  onClick={onPrevious}
                />
                <NavButton
                  label={t('Next')}
                  shortcut="↓"
                  icon={ChevronDown}
                  onClick={onNext}
                />
                <SheetClose asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t('Close')}
                  >
                    <X />
                  </Button>
                </SheetClose>
              </div>
            }
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
  pieceLogoUrl,
  currentUserId,
  projectType,
  controls,
}: ActivityDetailProps) {
  const { action, piece } = activityUtils.formatRan({
    row,
    actionDisplayName,
    pieceDisplayName,
  });
  const memberName =
    row.member === null ? null : activityUtils.memberName(row.member);

  return (
    <>
      <SheetHeader className="flex-row items-start gap-3 pr-5">
        {pieceLogoUrl !== undefined && (
          <div className="hidden shrink-0 sm:block">
            <PieceIcon
              logoUrl={pieceLogoUrl}
              displayName={pieceDisplayName}
              size="md"
              border
              showTooltip={false}
            />
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <SheetTitle className="truncate">{action}</SheetTitle>
          <div className="flex min-w-0 flex-col gap-y-1 text-xs text-gray-11 sm:flex-row sm:items-center sm:gap-x-2">
            {piece !== null && (
              <span className="flex min-w-0 items-center gap-2">
                <span className="truncate">{piece}</span>
                <span aria-hidden className="hidden sm:inline">
                  ·
                </span>
              </span>
            )}
            <span className="flex shrink-0 items-center gap-2">
              {row.status === 'SUCCEEDED' ? (
                <StatusIconWithText
                  icon={Check}
                  text={t('Succeeded')}
                  variant="success"
                />
              ) : (
                <StatusIconWithText
                  icon={X}
                  text={t('Failed')}
                  variant="error"
                />
              )}
              <span aria-hidden>·</span>
              <span>{formatUtils.formatDuration(row.durationMs, true)}</span>
            </span>
          </div>
        </div>
        {controls}
      </SheetHeader>

      <SheetBody
        data-activity-body
        tabIndex={0}
        className="outline-hidden focus-visible:ring-2 focus-visible:ring-accent-8 focus-visible:ring-inset"
      >
        <dl className="flex flex-col gap-3 text-sm">
          <DetailRow
            label={t('When')}
            value={activityUtils.formatWhen(row.created)}
          />
          <DetailRow
            label={t('Client')}
            value={
              <span className="flex items-center gap-2">
                <ClientIcon
                  icon={mcpClientDisplay.icon(row.clientKey)}
                  className="size-5"
                />
                {mcpClientDisplay.label({
                  key: row.clientKey,
                  clientName: null,
                })}
              </span>
            }
          />
          <DetailRow
            label={t('Member')}
            value={
              row.member === null || memberName === null ? null : (
                <span className="flex items-center gap-2">
                  <UserAvatar
                    name={memberName}
                    email={row.member.email}
                    imageUrl={row.member.imageUrl}
                    size={20}
                    disableTooltip
                  />
                  {row.member.id === currentUserId
                    ? t('{name} · you', { name: memberName })
                    : memberName}
                </span>
              )
            }
          />
          <DetailRow
            label={t('Project')}
            value={
              row.projectName === null ? null : (
                <span className="flex flex-wrap items-center gap-1.5">
                  {row.projectName}
                  {projectType !== undefined && (
                    <Badge variant="secondary">
                      {projectType === ProjectType.PERSONAL
                        ? t('Personal')
                        : t('Team')}
                    </Badge>
                  )}
                </span>
              )
            }
          />
          <DetailRow
            label={t('Account')}
            value={
              <AccountValue
                pieceLogoUrl={pieceLogoUrl}
                account={activityUtils.formatAccount(row)}
              />
            }
          />
        </dl>

        {row.errorMessage !== null && (
          <Alert variant="destructive">
            <TriangleAlert />
            <AlertTitle>{t('Error')}</AlertTitle>
            <AlertDescription className="break-words whitespace-pre-wrap">
              {activityUtils.errorText(row.errorMessage)}
            </AlertDescription>
          </Alert>
        )}

        {row.hasPayload ? (
          <ActivityPayload id={row.id} showOutput={row.status !== 'FAILED'} />
        ) : (
          <p className="text-sm text-gray-11">
            {t('The input and output were not kept for this call.')}
          </p>
        )}
      </SheetBody>
    </>
  );
}

function ActivityPayload({
  id,
  showOutput,
}: {
  id: string;
  showOutput: boolean;
}) {
  const { data, isLoading, isError } = mcpActivityQueries.usePayload({ id });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <p className="text-sm text-gray-11">
        {t('The input and output are no longer available.')}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {data.truncated && (
        <p className="text-sm text-gray-11">
          {t('Too large to keep in full — some of it was dropped.')}
        </p>
      )}
      <PayloadSection
        label={t('Input')}
        data={activityUtils.actionInput(data.input)}
      />
      {showOutput ? (
        <OutputSection output={activityUtils.parseOutput(data.output)} />
      ) : (
        <Collapsible className="flex flex-col gap-2">
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="w-fit">
              {t('Show full output')}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <PayloadValue data={data.output} />
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

function OutputSection({ output }: { output: ParsedOutput }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-medium text-gray-11">{t('Output')}</div>
      {output.summary !== null && <p className="text-sm">{output.summary}</p>}
      {output.data !== null && <PayloadValue data={output.data} />}
    </div>
  );
}

function PayloadValue({ data }: { data: unknown }) {
  if (typeof data === 'string') {
    return (
      <pre className="rounded-xl border bg-gray-2 p-3 text-xs break-words whitespace-pre-wrap">
        {data}
      </pre>
    );
  }
  return <SimpleJsonViewer data={data} maxHeight={260} fontSize="12px" />;
}

function PayloadSection({ label, data }: { label: string; data: unknown }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-medium text-gray-11">{label}</div>
      {data === null || data === undefined ? (
        <div className="text-sm text-gray-11">—</div>
      ) : (
        <PayloadValue data={data} />
      )}
    </div>
  );
}

function AccountValue({
  pieceLogoUrl,
  account,
}: {
  pieceLogoUrl: string | undefined;
  account: string | null;
}) {
  if (account === null) {
    return <span className="text-gray-11">—</span>;
  }
  return (
    <span className="flex items-center gap-2">
      {pieceLogoUrl !== undefined && (
        <LogoPlate
          src={pieceLogoUrl}
          alt=""
          border
          className="size-5"
          innerClassName="size-[62%]"
        />
      )}
      {account}
    </span>
  );
}

function NavButton({ label, shortcut, icon: Icon, onClick }: NavButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span>
          <Button
            variant="ghost"
            size="icon-sm"
            className={cn(!onClick && 'cursor-default opacity-50')}
            aria-disabled={!onClick}
            onClick={onClick}
            aria-label={label}
          >
            <Icon />
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {label} <span className="text-gray-11">{shortcut}</span>
      </TooltipContent>
    </Tooltip>
  );
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex gap-4">
      <dt className="w-24 shrink-0 text-gray-11">{label}</dt>
      <dd className="min-w-0 break-words">{value ?? '—'}</dd>
    </div>
  );
}

type ActivityDetailSheetProps = {
  row: PopulatedMcpActivity | null;
  onClose: () => void;
  actionDisplayName: string | undefined;
  pieceDisplayName: string | undefined;
  pieceLogoUrl: string | undefined;
  currentUserId: string | undefined;
  projectType: ProjectType | undefined;
  onPrevious?: () => void;
  onNext?: () => void;
};

type NavButtonProps = {
  label: string;
  shortcut: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: (() => void) | undefined;
};

type ActivityDetailProps = {
  row: PopulatedMcpActivity;
  controls: React.ReactNode;
  actionDisplayName: string | undefined;
  pieceDisplayName: string | undefined;
  pieceLogoUrl: string | undefined;
  currentUserId: string | undefined;
  projectType: ProjectType | undefined;
};
