import {
  ApFlagId,
  Permission,
  ProjectType,
} from '@activepieces/shared';
import { t } from 'i18next';
import {
  Bell,
  GitBranch,
  KeyRound,
  Link2,
  Mail,
  Puzzle,
  Settings,
  SlidersHorizontal,
  User,
  Users,
} from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';

import { McpSvg } from '@/assets/img/custom/mcp';
import { cn } from '@/lib/utils';
import { projectCollectionUtils } from '@/features/projects';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';

const ACCOUNT_NAV = [
  { to: '/user-settings/profile', label: 'Profile', icon: User },
  { to: '/user-settings/contact', label: 'Email', icon: Mail },
  { to: '/user-settings/connections', label: 'Connected Accounts', icon: Link2 },
  { to: '/user-settings/security', label: 'Password', icon: KeyRound },
  { to: '/user-settings/preferences', label: 'Preferences', icon: SlidersHorizontal },
];

function NavItem({ to, label, icon: Icon }: { to: string; label: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm font-medium transition-colors hover:bg-sidebar-accent',
          isActive && 'bg-sidebar-accent text-foreground',
          !isActive && 'text-muted-foreground',
        )
      }
    >
      <Icon className="w-4 h-4 shrink-0" />
      {t(label)}
    </NavLink>
  );
}

function WorkspaceNav() {
  const { project } = projectCollectionUtils.useCurrentProject();
  const { checkAccess } = useAuthorization();
  const { data: showAlerts } = flagsHooks.useFlag<boolean>(ApFlagId.SHOW_ALERTS);
  const { data: showProjectMembers } = flagsHooks.useFlag<boolean>(ApFlagId.SHOW_PROJECT_MEMBERS);

  const isTeam = project.type === ProjectType.TEAM;
  const canReadMembers = checkAccess(Permission.READ_PROJECT_MEMBER);
  const canReadAlerts = checkAccess(Permission.READ_ALERT);
  const canReadEnvironment = checkAccess(Permission.READ_PROJECT_RELEASE);

  return (
    <div className="flex flex-col gap-0.5">
      <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5 mt-2">
        {t('Workspace')}
      </p>
      <NavItem to="/user-settings/workspace/general" label="General" icon={Settings} />
      {isTeam && canReadMembers && showProjectMembers && (
        <NavItem to="/user-settings/workspace/members" label="Members" icon={Users} />
      )}
      {isTeam && canReadAlerts && showAlerts && (
        <NavItem to="/user-settings/workspace/alerts" label="Alert Emails" icon={Bell} />
      )}
      <NavLink
        to="/user-settings/workspace/mcp"
        className={({ isActive }) =>
          cn(
            'flex items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm font-medium transition-colors hover:bg-sidebar-accent',
            isActive && 'bg-sidebar-accent text-foreground',
            !isActive && 'text-muted-foreground',
          )
        }
      >
        <McpSvg className="w-4 h-4 shrink-0" />
        {t('MCP Server')}
      </NavLink>
      <NavItem to="/user-settings/workspace/pieces" label="Pieces" icon={Puzzle} />
      {canReadEnvironment && (
        <NavItem to="/user-settings/workspace/environment" label="Environment" icon={GitBranch} />
      )}
    </div>
  );
}

export default function UserSettingsLayout() {
  return (
    <div className="flex h-full w-full">
      <nav className="w-52 shrink-0 border-r bg-muted/30 flex flex-col gap-0.5 p-3 overflow-y-auto">
        <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
          {t('Account')}
        </p>
        {ACCOUNT_NAV.map(({ to, label, icon }) => (
          <NavItem key={to} to={to} label={label} icon={icon} />
        ))}
        <WorkspaceNav />
      </nav>
      <div className="flex-1 min-w-0 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}
