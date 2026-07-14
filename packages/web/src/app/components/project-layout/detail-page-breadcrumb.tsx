import { t } from 'i18next';
import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { authenticationSession } from '@/lib/authentication-session';

import { ProjectSwitcher } from './project-switcher';

// The header title for detail pages (builder, run details, table editor):
// mirrors the dashboard header's breadcrumb but appends the real path —
// project / section / entity. Unlike the dashboard header, the section is a
// plain link back to its list page (no hover navigation menu).
export function DetailPageBreadcrumb({
  section,
  children,
}: DetailPageBreadcrumbProps) {
  const navigate = useNavigate();
  const { label, path } = SECTIONS[section];

  return (
    <div className="flex min-w-0 items-center gap-0.5">
      <ProjectSwitcher />
      <span className="text-sm font-normal text-muted-foreground/40">/</span>
      <Button
        variant="ghost"
        size="sm"
        className="h-auto shrink-0 rounded-md px-1.5 py-1 text-sm font-medium"
        onClick={() =>
          navigate(authenticationSession.appendProjectRoutePrefix(path))
        }
      >
        {t(label)}
      </Button>
      <span className="text-sm font-normal text-muted-foreground/40">/</span>
      <div className="flex min-w-0 items-center text-sm font-medium">
        {children}
      </div>
    </div>
  );
}

const SECTIONS: Record<DetailPageSection, { label: string; path: string }> = {
  automations: { label: 'Automations', path: '/automations' },
  runs: { label: 'Runs', path: '/runs' },
};

export type DetailPageSection = 'automations' | 'runs';

type DetailPageBreadcrumbProps = {
  section: DetailPageSection;
  children: ReactNode;
};
