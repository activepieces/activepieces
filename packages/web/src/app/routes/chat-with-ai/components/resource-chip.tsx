import { t } from 'i18next';
import { LucideIcon, Table2, Workflow } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

import {
  Change,
  ChangeKind,
} from '@/features/chat/lib/resources/change-summary';
import {
  ResourceKind,
  ResourceRef,
  resourceRegistry,
} from '@/features/chat/lib/resources/registry';
import { chatPanelUtils } from '@/features/workspace/lib/chat-panel-open';
import { isPlainLeftClick } from '@/lib/dom-utils';
import { cn } from '@/lib/utils';

export function ResourceChip({ change }: { change: Change }) {
  const { pathname } = useLocation();
  const { icon: Icon } = KINDS[change.ref.kind];
  const name = resourceDisplay.name(change.ref);
  const content = (
    <>
      <Icon className="size-3.5 shrink-0 text-gray-11" aria-hidden />
      <span
        className={cn(
          'truncate',
          change.kind === 'deleted' && 'line-through decoration-gray-9',
        )}
      >
        {name}
      </span>
      {change.kind !== 'updated' && (
        <>
          {' '}
          <span className="shrink-0 text-gray-10">
            {resourceDisplay.changeLabel(change.kind)}
          </span>
        </>
      )}
    </>
  );
  if (change.kind === 'deleted') {
    return <span className={cn(CHIP_CLASS, 'text-gray-11')}>{content}</span>;
  }
  const route = resourceRegistry.route(change.ref);
  const here = resourceRegistry.isOn(pathname, change.ref);
  return (
    <Link
      to={route}
      aria-current={here ? 'page' : undefined}
      onClick={(event) => {
        if (!isPlainLeftClick(event)) return;
        event.preventDefault();
        resourceDisplay.openBeside(change.ref);
      }}
      className={cn(
        CHIP_CLASS,
        'text-gray-12 transition-colors duration-150 ease-move hover:border-gray-7 hover:bg-gray-3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-8 aria-[current=page]:bg-gray-3',
      )}
    >
      {content}
    </Link>
  );
}

function name(ref: ResourceRef): string {
  return KINDS[ref.kind].name(ref.name || t('Untitled'));
}

function changeLabel(kind: ChangeKind): string {
  switch (kind) {
    case 'created':
      return t('New');
    case 'updated':
      return t('Edited');
    case 'deleted':
      return t('Deleted');
  }
}

function icon(kind: ResourceKind): LucideIcon {
  return KINDS[kind].icon;
}

function openBeside(ref: ResourceRef): void {
  chatPanelUtils.openBeside({
    route: resourceRegistry.route(ref),
    push: true,
    name: name(ref),
  });
}

const CHIP_CLASS =
  'inline-flex h-7 max-w-full min-w-0 items-center gap-1.5 rounded-full border border-gray-6 bg-gray-1 pr-2.5 pl-2 text-xs';

const KINDS: Record<
  ResourceKind,
  { icon: LucideIcon; name: (name: string) => string }
> = {
  flow: {
    icon: Workflow,
    name: (value) => t('{name} flow', { name: value }),
  },
  table: {
    icon: Table2,
    name: (value) => t('{name} table', { name: value }),
  },
};

export const resourceDisplay = { name, changeLabel, icon, openBeside };
