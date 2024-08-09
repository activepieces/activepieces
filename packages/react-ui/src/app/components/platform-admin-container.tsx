import {
  LayoutGrid,
  Palette,
  Puzzle,
  Settings,
  UserCog,
  Workflow,
} from 'lucide-react';

import { platformHooks } from '@/hooks/platform-hooks';

import { AllowOnlyLoggedInUserOnlyGuard } from './allow-logged-in-user-only-guard';
import { Sidebar, SidebarLink } from './sidebar';

export function PlatformAdminContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  const { platform } = platformHooks.useCurrentPlatform();

  const links: SidebarLink[] = [
    {
      to: '/platform/projects',
      label: 'Projects',
      icon: LayoutGrid,
      locked: !platform.manageProjectsEnabled,
    },
    {
      to: '/platform/appearance',
      label: 'Appearance',
      icon: Palette,
      locked: !platform.customAppearanceEnabled,
    },
    {
      to: '/platform/pieces',
      label: 'Pieces',
      icon: Puzzle,
      locked: !platform.managePiecesEnabled,
    },
    {
      to: '/platform/templates',
      label: 'Templates',
      icon: Workflow,
      locked: !platform.manageTemplatesEnabled,
    },
    {
      to: '/platform/users',
      label: 'Users',
      icon: UserCog,
    },
    {
      to: '/platform/settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <AllowOnlyLoggedInUserOnlyGuard>
      <Sidebar links={links}>{children}</Sidebar>
    </AllowOnlyLoggedInUserOnlyGuard>
  );
}
