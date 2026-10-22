import {
  ColorName,
  PROJECT_COLOR_PALETTE,
  WorkerGroupSummary,
  WorkerGroupsOverview,
} from '@activepieces/shared';
import { t } from 'i18next';
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  TriangleAlert,
  Workflow,
  X,
} from 'lucide-react';
import React, { useState } from 'react';

import { StatusDot, adminLayout } from '@/app/components/admin';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { cn } from '@/lib/utils';

import { MoveItem, groupUtils, useMover } from './hooks';
import { MoveAllDialog } from './move-all-dialog';

export function WorkerGroupSelect({
  kind,
  value,
  inherited,
  overview,
  onChange,
  subject,
  detail,
  confirmEvery,
  trigger,
  excludeLabel,
  firstOption,
  emptyHint,
  align = 'start',
  disabled = false,
}: {
  kind: 'project' | 'flow';
  value: string | null | undefined;
  inherited?: string | null;
  overview: WorkerGroupsOverview | undefined;
  onChange: (to: string | null) => void;
  subject: string;
  detail?: string;
  confirmEvery?: (to: string | null) => { title: string; body: string };
  trigger?: React.ReactNode;
  excludeLabel?: string | null;
  firstOption?: string;
  emptyHint?: string;
  align?: 'start' | 'end';
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(NO_ACTIVE_OPTION);
  const [confirming, setConfirming] = useState<{ to: string | null } | null>(
    null,
  );
  const groups = (overview?.groups ?? []).filter(
    (g) => g.scope === kind && g.label !== excludeLabel,
  );
  const first =
    firstOption ??
    (kind === 'flow'
      ? t('Same as project ({group})', {
          group: groupUtils.name(inherited ?? null),
        })
      : t('Shared workers'));

  const pick = (to: string | null) => {
    setOpen(false);
    if (to === value) return;
    const target = groupUtils.find({ overview, label: to, scope: kind });
    if (confirmEvery || (target && target.online === 0)) {
      setConfirming({ to });
      return;
    }
    onChange(to);
  };

  const confirmText = confirming
    ? confirmEvery
      ? confirmEvery(confirming.to)
      : {
          title: t('Move {subject} to {group}?', {
            subject,
            group: groupUtils.name(confirming.to),
          }),
          body: detail ?? '',
        }
    : null;
  const targetDown =
    confirming !== null &&
    groupUtils.find({ overview, label: confirming.to, scope: kind })?.online ===
      0;

  return (
    <>
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          setActive(NO_ACTIVE_OPTION);
        }}
      >
        <PopoverTrigger asChild>
          {trigger ?? (
            <Button
              variant="outline"
              size="sm"
              disabled={disabled}
              className="w-full justify-between gap-3 font-normal"
              title={selectedText({ kind, value: value ?? null, inherited })}
            >
              <SelectedLabel
                kind={kind}
                value={value ?? null}
                inherited={inherited}
                overview={overview}
              />
              <ChevronDown className="size-4 shrink-0 text-gray-10" />
            </Button>
          )}
        </PopoverTrigger>
        <PopoverContent
          className="w-auto min-w-[max(var(--radix-popover-trigger-width),18rem)] max-w-96 p-1"
          align={align}
          collisionPadding={16}
        >
          <Command value={active} onValueChange={setActive}>
            {groups.length > PICKER_SEARCH_AFTER && (
              <CommandInput placeholder={t('Find a group')} />
            )}
            <CommandList className="max-h-[19.5rem] overflow-y-auto">
              <CommandGroup>
                {excludeLabel !== null && (
                  <Option
                    title={first}
                    health={
                      kind === 'project' && !firstOption
                        ? overview?.defaultGroup ?? null
                        : null
                    }
                    checkable={value !== undefined}
                    selected={value === null}
                    onSelect={() => pick(null)}
                  />
                )}
                {groups.map((g) => (
                  <Option
                    key={g.label}
                    title={groupUtils.name(g.label)}
                    health={g}
                    checkable={value !== undefined}
                    selected={value === g.label}
                    onSelect={() => pick(g.label)}
                  />
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
          {groups.length === 0 && <NoGroupsHint kind={kind} text={emptyHint} />}
        </PopoverContent>
      </Popover>
      <Dialog
        open={confirming !== null}
        onOpenChange={(o) => !o && setConfirming(null)}
      >
        <DialogContent className={adminLayout.dialog.sm}>
          {confirmText && (
            <>
              <DialogHeader className="mb-0">
                <DialogTitle className="pr-6">{confirmText.title}</DialogTitle>
                {confirmText.body && (
                  <DialogDescription>{confirmText.body}</DialogDescription>
                )}
              </DialogHeader>
              {targetDown && (
                <p className="flex items-start gap-2 text-sm text-danger-11">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                  {t(
                    'The group {group} has no workers online. Runs will wait there until a worker is back.',
                    {
                      group: groupUtils.name(confirming?.to ?? null),
                    },
                  )}
                </p>
              )}
              <DialogFooter className="mt-0">
                <Button variant="outline" onClick={() => setConfirming(null)}>
                  {t('Cancel')}
                </Button>
                <Button
                  onClick={() => {
                    const to = confirming?.to ?? null;
                    setConfirming(null);
                    onChange(to);
                  }}
                >
                  {targetDown ? t('Move anyway') : t('Move')}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function SelectedLabel({
  kind,
  value,
  inherited,
  overview,
}: {
  kind: 'project' | 'flow';
  value: string | null;
  inherited?: string | null;
  overview: WorkerGroupsOverview | undefined;
}) {
  const effective =
    kind === 'flow' && value === null ? inherited ?? null : value;
  const group = groupUtils.find({
    overview,
    label: effective,
    scope: kind === 'flow' && value === null ? 'project' : kind,
  });
  const down = group !== undefined && group.online === 0;
  return (
    <span className="flex min-w-0 items-center gap-2">
      {down && (
        <>
          <StatusDot tone="danger" />
          <span className="sr-only">{t('No workers online')}</span>
        </>
      )}
      <span className="truncate">
        {selectedText({ kind, value, inherited })}
      </span>
    </span>
  );
}

export function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative w-full max-w-sm">
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-10" />
      <Input
        className="px-9"
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          type="button"
          aria-label={t('Clear search')}
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-gray-10 hover:bg-gray-3 hover:text-gray-12"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

export function Pager({
  offset,
  count,
  total,
  noun,
  onPrevious,
  onNext,
}: {
  offset: number;
  count: number;
  total: number;
  noun?: string;
  onPrevious?: () => void;
  onNext?: () => void;
}) {
  const single = total <= count && offset === 0;
  if (single && !noun) return null;
  return (
    <div className="flex h-8 items-center justify-end gap-2 text-sm text-gray-11">
      <span className="tabular-nums">
        {single
          ? `${total.toLocaleString()} ${noun}`
          : t('{from}–{to} of {total}', {
              from: (offset + 1).toLocaleString(),
              to: (offset + count).toLocaleString(),
              total: total.toLocaleString(),
            })}
      </span>
      {!single && (
        <>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={!onPrevious}
            onClick={onPrevious}
            aria-label={t('Previous page')}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={!onNext}
            onClick={onNext}
            aria-label={t('Next page')}
          >
            <ChevronRight />
          </Button>
        </>
      )}
    </div>
  );
}

export function SelectionBar({
  items,
  kind,
  overview,
  onDone,
  selectAll,
  inline = false,
}: {
  items: MoveItem[];
  kind: 'project' | 'flow';
  overview: WorkerGroupsOverview | undefined;
  onDone: () => void;
  selectAll?: {
    total: number;
    group: WorkerGroupSummary;
    active: boolean;
    onToggle: () => void;
  };
  inline?: boolean;
}) {
  const { move } = useMover();
  const [movingAll, setMovingAll] = useState(false);
  if (items.length === 0) return null;
  if (selectAll?.active) {
    return (
      <BarFrame inline={inline}>
        <span className="text-sm text-gray-11">
          {t('All {count, number} selected', { count: selectAll.total })}
        </span>
        <Button size="sm" onClick={() => setMovingAll(true)}>
          {t('Move to…')}
        </Button>
        <Button variant="ghost" size="sm" onClick={onDone}>
          {t('Clear')}
        </Button>
        <MoveAllDialog
          group={selectAll.group}
          overview={overview}
          selected={selectAll.total}
          open={movingAll}
          onOpenChange={(open) => {
            setMovingAll(open);
            if (!open) onDone();
          }}
        />
      </BarFrame>
    );
  }
  const countOf = (list: MoveItem[]) =>
    kind === 'project'
      ? t('{count, plural, =1 {1 project} other {# projects}}', {
          count: list.length,
        })
      : t('{count, plural, =1 {1 flow} other {# flows}}', {
          count: list.length,
        });
  return (
    <BarFrame inline={inline}>
      <span className="text-sm text-gray-11">
        {t('{count} selected', { count: items.length })}
      </span>
      {selectAll && selectAll.total > items.length && (
        <TextLink onClick={selectAll.onToggle}>
          {t('Select all {count, number}', { count: selectAll.total })}
        </TextLink>
      )}
      <WorkerGroupSelect
        kind={kind}
        value={undefined}
        inherited={null}
        overview={overview}
        excludeLabel={sharedFrom(items)}
        subject={countOf(items)}
        firstOption={
          kind === 'flow' ? t('Back to each flow’s project group') : undefined
        }
        confirmEvery={(to) => {
          const moving = items.filter((i) => i.from !== to);
          const what = countOf(moving);
          const flows = moving.reduce((sum, i) => sum + (i.flows ?? 0), 0);
          return {
            title:
              kind === 'flow' && to === null
                ? t('Move {what} back to their project groups?', { what })
                : t('Move {what} to {group}?', {
                    what,
                    group: groupUtils.name(to),
                  }),
            body:
              [
                kind === 'project' && flows > 0
                  ? t(
                      '{count, plural, =1 {1 flow moves with them.} other {# flows move with them.}}',
                      { count: flows },
                    )
                  : null,
                items.length > moving.length
                  ? t(
                      '{count, plural, =1 {1 of the picked items is already on {group}.} other {# of the picked items are already on {group}.}}',
                      {
                        count: items.length - moving.length,
                        group: groupUtils.name(to),
                      },
                    )
                  : null,
              ]
                .filter(Boolean)
                .join(' ') || t('You can undo this right after.'),
          };
        }}
        onChange={(to) => {
          move({ items, to })
            .then((done) => done && onDone())
            .catch(() => undefined);
        }}
        trigger={<Button size="sm">{t('Move to…')}</Button>}
      />
      <Button variant="ghost" size="sm" onClick={onDone}>
        {t('Clear')}
      </Button>
    </BarFrame>
  );
}

export function ProjectBadge({
  name,
  color,
  size = 'sm',
}: {
  name: string;
  color: string;
  size?: BadgeSize;
}) {
  const palette =
    PROJECT_COLOR_PALETTE[color as ColorName] ??
    Object.values(PROJECT_COLOR_PALETTE)[0];
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center font-semibold',
        BADGE_SIZE[size],
      )}
      style={{ backgroundColor: palette.color, color: palette.textColor }}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

export function FlowBadge({ size = 'sm' }: { size?: BadgeSize }) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center bg-gray-3 text-gray-11',
        BADGE_SIZE[size],
      )}
    >
      <Workflow className={size === 'lg' ? 'size-3.5' : 'size-3'} />
    </span>
  );
}

const BADGE_SIZE = {
  sm: 'size-5 rounded-md text-xs',
  lg: 'size-8 rounded-lg text-xs',
};
type BadgeSize = keyof typeof BADGE_SIZE;

export function Hint({
  text,
  children,
}: {
  text: string;
  children: React.ReactElement;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent className="max-w-xs">{text}</TooltipContent>
    </Tooltip>
  );
}

export function OffBadge() {
  return (
    <span className="shrink-0 rounded-md bg-gray-3 px-1.5 py-0.5 text-xs text-gray-11">
      {t('Off')}
    </span>
  );
}

export function TextLink({
  onClick,
  href,
  control,
  children,
}: {
  onClick?: () => void;
  href?: string;
  control?: AdminControl;
  children: React.ReactNode;
}) {
  const className =
    'font-medium text-accent-11 underline-offset-4 hover:underline';
  if (href) {
    return (
      <a
        {...adminControl(control)}
        href={href}
        target="_blank"
        rel="noreferrer"
        className={className}
      >
        {children}
      </a>
    );
  }
  return (
    <button
      {...adminControl(control)}
      type="button"
      onClick={onClick}
      className={className}
    >
      {children}
    </button>
  );
}

export function modelSentence() {
  return t(
    'Worker groups are servers set aside for specific projects or flows. Everything else runs on your shared workers.',
  );
}

const NO_ACTIVE_OPTION = '__none__';
const PICKER_SEARCH_AFTER = 7;

function BarFrame({
  inline,
  children,
}: {
  inline: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex h-12 items-center gap-3 rounded-xl border bg-(--admin-surface) pl-4 pr-2 text-sm',
        inline ? 'shrink-0' : 'sticky bottom-6 z-40 mx-auto w-fit shadow-lg',
      )}
    >
      {children}
    </div>
  );
}

function selectedText({
  kind,
  value,
  inherited,
}: {
  kind: 'project' | 'flow';
  value: string | null;
  inherited?: string | null;
}) {
  return kind === 'flow' && value === null
    ? t('Same as project ({group})', {
        group: groupUtils.name(inherited ?? null),
      })
    : groupUtils.name(value);
}

function sharedFrom(items: MoveItem[]) {
  const from = items[0]?.from;
  return items.every((i) => i.from === from) ? from : undefined;
}

function Option({
  title,
  health,
  checkable,
  selected,
  onSelect,
}: {
  title: string;
  health: { online: number; slots: number } | null;
  checkable: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  const down = health !== null && health.online === 0;
  return (
    <CommandItem value={title} onSelect={onSelect} className="gap-2 py-2">
      {checkable && (
        <Check
          className={cn(
            'size-4 shrink-0',
            selected ? 'opacity-100' : 'opacity-0',
          )}
        />
      )}
      <span className="flex-1 truncate">{title}</span>
      {health !== null && (
        <StatusDot
          tone={down ? 'danger' : 'success'}
          className={cn(
            'w-36 shrink-0 text-xs',
            down ? 'text-danger-11' : 'text-gray-10',
          )}
        >
          {down
            ? t('No workers online')
            : t('Concurrency {count, number}', {
                count: health.slots,
              })}
        </StatusDot>
      )}
    </CommandItem>
  );
}

function NoGroupsHint({
  kind,
  text,
}: {
  kind: 'project' | 'flow';
  text?: string;
}) {
  return (
    <p className="border-t px-3 py-2 text-xs text-gray-11">
      {text ??
        (kind === 'flow'
          ? t(
              'No flow groups yet. Flow groups come from workers started for flows.',
            )
          : t(
              'No project groups yet. Project groups come from workers started for projects.',
            ))}{' '}
      <TextLink href={DOCS_URL}>{t('How to add one')}</TextLink>
    </p>
  );
}

export const DOCS_URL =
  'https://www.activepieces.com/docs/install/configure-operate/worker-groups';
