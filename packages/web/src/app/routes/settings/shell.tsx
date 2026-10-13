import { t } from 'i18next';
import {
  Building2,
  KeyRound,
  SlidersHorizontal,
  UserCog,
  Variable as VariableIcon,
} from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { PageTitle } from '@/app/components/page-title';
import { cn } from '@/lib/utils';
import { authenticationSession } from '@/lib/authentication-session';

type SectionId =
  | 'general'
  | 'variables'
  | 'workspace'
  | 'account'
  | 'security';

type Section = {
  id: SectionId;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  description: string;
};

const SECTIONS: Section[] = [
  {
    id: 'general',
    label: t('General'),
    icon: SlidersHorizontal,
    description: t('Workspace name, branding, and default preferences.'),
  },
  {
    id: 'variables',
    label: t('Variables'),
    icon: VariableIcon,
    description: t('Reusable values shared across automations.'),
  },
  {
    id: 'workspace',
    label: t('Workspace'),
    icon: Building2,
    description: t('Members, alert emails, integrations, and environment.'),
  },
  {
    id: 'account',
    label: t('Account'),
    icon: UserCog,
    description: t('Your profile, appearance, and personal preferences.'),
  },
  {
    id: 'security',
    label: t('Security'),
    icon: KeyRound,
    description: t('Password, sessions, two-factor, and API access.'),
  },
];

export function SettingsShell({
  children,
}: {
  children: (section: SectionId) => React.ReactNode;
}) {
  const location = useLocation();
  const params = useParams<{ projectId?: string }>();
  const projectId = params.projectId ?? authenticationSession.getProjectId();

  const active = ((): SectionId => {
    const m = location.pathname.match(/\/settings\/([^/?#]+)/);
    const id = (m?.[1] ?? 'general') as SectionId;
    return SECTIONS.some((s) => s.id === id) ? id : 'general';
  })();

  const base = projectId ? `/projects/${projectId}/settings` : '/settings';

  return (
    <PageTitle title={t('Settings')}>
      <div className="mx-auto flex w-full max-w-6xl gap-8 p-6">
        <aside className="w-56 shrink-0">
          <div className="mb-4 px-3 text-sm font-medium text-gray-11">
            {t('Settings')}
          </div>
          <nav className="flex flex-col gap-0.5">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              const isActive = s.id === active;
              return (
                <Link
                  key={s.id}
                  to={`${base}/${s.id}`}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-gray-4 font-medium text-gray-12'
                      : 'text-gray-11 hover:bg-gray-3 hover:text-gray-12',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {s.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="min-w-0 flex-1">{children(active)}</div>
      </div>
    </PageTitle>
  );
}

export function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-gray-11">{description}</p>
    </div>
  );
}

export function PlaceholderCard({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-6 bg-gray-2 p-8 text-center text-sm text-gray-11">
      {`${label} is being rebuilt and will be available shortly.`}
    </div>
  );
}
