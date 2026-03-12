import { t } from 'i18next';
import { Dot, FolderIcon, User } from 'lucide-react';

import { TableIcon } from '@/components/icons/table';
import { WorkflowIcon } from '@/components/icons/workflow';

import { type SearchHistoryItem } from './search-history';
import { STATIC_PAGES } from './static-pages';
import { type SearchResultItem } from './use-global-search-results';

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
  iconBgColor?: string;
  iconTextColor?: string;
  iconLetter?: string;
};

function ItemIcon({
  type,
  pageIcon: PageIcon,
  iconBgColor,
  iconTextColor,
  iconLetter,
}: ItemIconProps) {
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
    <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground/80">
      <span>—</span>
      {hasProject && <span>{projectName}</span>}
      {hasProject && hasFolder && <span>/</span>}
      {hasFolder && (
        <span className="flex items-center gap-0.5">
          <FolderIcon
            className="size-4! mr-0.5 text-muted-foreground/80 shrink-0"
            fill="currentColor"
            strokeWidth={0}
          />
          <span>{folderName}</span>
        </span>
      )}
      {(hasProject || hasFolder) && hasUpdated && (
        <Dot className="size-3! shrink-0 text-muted-foreground/80" />
      )}
      {hasUpdated && (
        <span className="whitespace-nowrap">{`Last Modified: ${timeAgo(
          updated!,
        )}`}</span>
      )}
    </span>
  );
}

export function SearchResultRow({ item }: { item: SearchResultItem }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <ItemIcon
        type={item.type}
        pageIcon={item.pageIcon}
        iconBgColor={item.iconBgColor}
        iconTextColor={item.iconTextColor}
        iconLetter={item.iconLetter}
      />
      <span className="min-w-0 shrink truncate text-sm font-medium">
        {item.label}
      </span>
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
    </div>
  );
}

export function HistoryResultRow({ item }: { item: SearchHistoryItem }) {
  const pageIcon =
    item.type === 'page'
      ? STATIC_PAGES.find((p) => p.id === item.id)?.icon
      : undefined;

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <ItemIcon
        type={item.type}
        pageIcon={pageIcon}
        iconBgColor={item.iconBgColor}
        iconTextColor={item.iconTextColor}
        iconLetter={item.iconLetter}
      />
      <span className="min-w-0 shrink truncate text-sm font-medium">
        {item.label}
      </span>
      {item.status === 'ENABLED' && (
        <span className="shrink-0 rounded-full bg-green-500/10 px-1.5 py-0.5 text-[10px] font-medium text-green-600">
          Live
        </span>
      )}
      <ItemMeta projectName={item.projectName} folderName={item.folderName} />
    </div>
  );
}
