import * as React from 'react';
import { Link, NavLink } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

function PageTabs({
  tabs,
  className,
}: {
  tabs: PageTab[][];
  className?: string;
}) {
  const groups = tabs.filter((group) => group.length > 0);
  return (
    <nav
      data-slot="page-tabs"
      className={cn(
        'scrollbar-none flex items-center gap-4 overflow-x-auto border-b',
        className,
      )}
    >
      {groups.map((group, index) => (
        <React.Fragment key={group[0].to}>
          {index > 0 && (
            <span aria-hidden className="h-5 w-px shrink-0 bg-gray-6" />
          )}
          {group.map((tab) => (
            <PageTabLink key={tab.to} tab={tab} />
          ))}
        </React.Fragment>
      ))}
    </nav>
  );
}

function PageTabLink({ tab }: { tab: PageTab }) {
  const Icon = tab.icon;
  const content = (
    <>
      {Icon && <Icon size={16} />}
      {tab.label}
      {tab.badge}
    </>
  );
  if (tab.active !== undefined) {
    return (
      <Link
        to={tab.to}
        aria-current={tab.active ? 'page' : undefined}
        className={PAGE_TAB_CLASS}
      >
        {content}
      </Link>
    );
  }
  return (
    <NavLink to={tab.to} end={tab.end} className={PAGE_TAB_CLASS}>
      {content}
    </NavLink>
  );
}

const PAGE_TAB_CLASS =
  'relative flex h-10 shrink-0 items-center gap-2 text-sm font-medium whitespace-nowrap text-gray-11 outline-hidden transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-gray-12 after:opacity-0 hover:text-gray-12 focus-visible:text-gray-12 aria-[current=page]:text-gray-12 aria-[current=page]:after:opacity-100 [&_svg]:size-4 [&_svg]:shrink-0';

function PageTabCount({ count }: { count: number }) {
  if (count <= 0) {
    return null;
  }
  return <Badge variant="info">{count > 10 ? '10+' : count}</Badge>;
}

export { PageTabs, PageTabCount };

type PageTab = {
  to: string;
  label: React.ReactNode;
  icon?: React.ComponentType<{ className?: string; size?: number }>;
  badge?: React.ReactNode;
  end?: boolean;
  active?: boolean;
};

export type { PageTab };
