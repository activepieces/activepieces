import { t } from 'i18next';
import { FolderIcon, User } from 'lucide-react';

import { BoxIcon } from '@/components/icons/box';
import { ConnectIcon } from '@/components/icons/connect';
import { HistoryIcon } from '@/components/icons/history';
import { Settings2Icon } from '@/components/icons/settings2';
import { TableIcon } from '@/components/icons/table';
import { VariableIcon } from '@/components/icons/variable';
import { WorkflowIcon } from '@/components/icons/workflow';

import {
  type DestinationKind,
  type SearchResultItem,
} from './use-global-search-results';

const DESTINATION_ICONS: Record<
  DestinationKind,
  React.ComponentType<{ className?: string; size?: number }>
> = {
  automations: WorkflowIcon,
  connections: ConnectIcon,
  runs: HistoryIcon,
  variables: VariableIcon,
  releases: BoxIcon,
  settings: Settings2Icon,
};

function timeAgo(date: Date | string): string {
  const ms = Date.now() - new Date(date).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

type ItemIconProps = {
  type: string;
  pageIcon?: React.ComponentType<{ className?: string; size?: number }>;
  destinationKind?: DestinationKind;
  iconBgColor?: string;
  iconTextColor?: string;
  iconLetter?: string;
};

function ItemIcon({
  type,
  pageIcon: PageIcon,
  destinationKind,
  iconBgColor,
  iconTextColor,
  iconLetter,
}: ItemIconProps) {
  if (type === 'destination' && destinationKind) {
    const DestinationIcon = DESTINATION_ICONS[destinationKind];
    return (
      <DestinationIcon size={16} className="shrink-0 text-muted-foreground" />
    );
  }

  if (type === 'project') {
    if (iconBgColor) {
      return (
        <span
          className="flex size-5 shrink-0 items-center justify-center rounded-[4px] text-[10px] font-bold"
          style={{ backgroundColor: iconBgColor, color: iconTextColor }}
        >
          {iconLetter}
        </span>
      );
    }
    return <User className="size-4 shrink-0 text-muted-foreground" />;
  }

  if (type === 'flow') {
    return (
      <span className="[&_svg]:text-violet-500! shrink-0">
        <WorkflowIcon className="size-4" />
      </span>
    );
  }

  if (type === 'table') {
    return (
      <span className="[&_svg]:text-emerald-500! shrink-0">
        <TableIcon className="size-4" />
      </span>
    );
  }

  if (type === 'folder') {
    return (
      <FolderIcon
        className="size-4 shrink-0 text-muted-foreground"
        fill="currentColor"
        strokeWidth={0}
      />
    );
  }

  if (type === 'page' && PageIcon) {
    return <PageIcon className="size-4 shrink-0 text-muted-foreground" />;
  }

  return null;
}

function ItemMeta({
  projectName,
  folderName,
  updated,
}: {
  projectName?: string | null;
  folderName?: string | null;
  updated?: string | null;
}) {
  const hasProject = !!projectName;
  const hasFolder = !!folderName;
  const hasUpdated = updated != null;

  if (!hasProject && !hasFolder && !hasUpdated) return null;

  return (
    <span className="flex shrink-0 items-center gap-1.5 text-[11px] text-muted-foreground/55">
      {hasProject && <span className="truncate">{projectName}</span>}
      {hasProject && hasFolder && <span aria-hidden>·</span>}
      {hasFolder && (
        <span className="flex items-center gap-1">
          <FolderIcon
            className="size-3! text-muted-foreground/55 shrink-0"
            fill="currentColor"
            strokeWidth={0}
          />
          <span className="truncate">{folderName}</span>
        </span>
      )}
      {(hasProject || hasFolder) && hasUpdated && <span aria-hidden>·</span>}
      {hasUpdated && (
        <span className="whitespace-nowrap">{timeAgo(updated!)}</span>
      )}
    </span>
  );
}

function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const parts: { text: string; match: boolean }[] = [];
  let lastIndex = 0;
  let idx = lowerText.indexOf(lowerQuery);
  while (idx !== -1) {
    if (idx > lastIndex)
      parts.push({ text: text.slice(lastIndex, idx), match: false });
    parts.push({ text: text.slice(idx, idx + query.length), match: true });
    lastIndex = idx + query.length;
    idx = lowerText.indexOf(lowerQuery, lastIndex);
  }
  if (lastIndex < text.length)
    parts.push({ text: text.slice(lastIndex), match: false });
  return (
    <>
      {parts.map((part, i) =>
        part.match ? (
          <span key={i} className="font-semibold">
            {part.text}
          </span>
        ) : (
          part.text
        ),
      )}
    </>
  );
}

export function SearchResultRow({
  item,
  query,
  actions,
}: {
  item: SearchResultItem;
  query?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <ItemIcon
        type={item.type}
        pageIcon={item.pageIcon}
        destinationKind={item.destinationKind}
        iconBgColor={item.iconBgColor}
        iconTextColor={item.iconTextColor}
        iconLetter={item.iconLetter}
      />
      <span className="min-w-0 shrink truncate text-sm font-normal">
        <HighlightText text={item.label} query={query ?? ''} />
      </span>
      {item.badge && (
        <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          {item.badge}
        </span>
      )}
      {item.status === 'ENABLED' && (
        <span className="shrink-0 rounded-full bg-green-500/10 px-1.5 py-0.5 text-[10px] font-medium text-green-600">
          {t('Live')}
        </span>
      )}
      <ItemMeta
        projectName={item.projectName}
        folderName={item.folderName}
        updated={item.updated}
      />
      {actions && <span className="ml-auto shrink-0">{actions}</span>}
    </div>
  );
}
