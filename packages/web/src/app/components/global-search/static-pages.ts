import { type ComponentType } from 'react';

import { BotIcon } from '@/components/icons/bot';
import { ChartLineIcon } from '@/components/icons/chart-line';
import { CompassIcon } from '@/components/icons/compass';
import { FileHeartIcon } from '@/components/icons/file-heart';
import { FileJson2Icon } from '@/components/icons/file-json2';
import { FrameIcon } from '@/components/icons/frame';
import { KeyRoundIcon } from '@/components/icons/key-round';
import { LayoutGridIcon } from '@/components/icons/layout-grid';
import { LogInIcon } from '@/components/icons/log-in';
import { MousePointerClickIcon } from '@/components/icons/mouse-pointer-click';
import { PaletteIcon } from '@/components/icons/palette';
import { PuzzleIcon } from '@/components/icons/puzzle';
import { ReceiptIcon } from '@/components/icons/receipt';
import { ServerIcon } from '@/components/icons/server';
import { Settings2Icon } from '@/components/icons/settings2';
import { ShieldIcon } from '@/components/icons/shield';
import { SquareDashedBottomCodeIcon } from '@/components/icons/square-dashed-bottom-code';
import { TrophyIcon } from '@/components/icons/trophy';
import { UnplugIcon } from '@/components/icons/unplug';
import { UsersIcon } from '@/components/icons/users';
import { WebhookIcon } from '@/components/icons/webhook';
import { WorkflowIcon } from '@/components/icons/workflow';

export type StaticPage = {
  id: string;
  label: string;
  href: string;
  icon: ComponentType<{ className?: string; size?: number }>;
  requiresPlatformAdmin?: boolean;
};

export const STATIC_PAGES: StaticPage[] = [
  {
    id: 'page-automations',
    label: 'Automations',
    href: '/automations',
    icon: WorkflowIcon,
  },
  {
    id: 'page-explore',
    label: 'Explore Templates',
    href: '/templates',
    icon: CompassIcon,
  },
  {
    id: 'page-impact',
    label: 'Impact',
    href: '/impact',
    icon: ChartLineIcon,
  },
  {
    id: 'page-leaderboard',
    label: 'Leaderboard',
    href: '/leaderboard',
    icon: TrophyIcon,
  },
  // Platform Admin pages
  {
    id: 'page-platform-projects',
    label: 'Platform Admin — Projects',
    href: '/platform/projects',
    icon: LayoutGridIcon,
    requiresPlatformAdmin: true,
  },
  {
    id: 'page-platform-users',
    label: 'Platform Admin — Users',
    href: '/platform/users',
    icon: UsersIcon,
    requiresPlatformAdmin: true,
  },
  {
    id: 'page-platform-ai',
    label: 'Platform Admin — AI Providers',
    href: '/platform/setup/ai',
    icon: BotIcon,
    requiresPlatformAdmin: true,
  },
  {
    id: 'page-platform-branding',
    label: 'Platform Admin — Branding',
    href: '/platform/setup/branding',
    icon: PaletteIcon,
    requiresPlatformAdmin: true,
  },
  {
    id: 'page-platform-connections',
    label: 'Platform Admin — Global Connections',
    href: '/platform/setup/connections',
    icon: UnplugIcon,
    requiresPlatformAdmin: true,
  },
  {
    id: 'page-platform-pieces',
    label: 'Platform Admin — Pieces',
    href: '/platform/setup/pieces',
    icon: PuzzleIcon,
    requiresPlatformAdmin: true,
  },
  {
    id: 'page-platform-templates',
    label: 'Platform Admin — Templates',
    href: '/platform/setup/templates',
    icon: LayoutGridIcon,
    requiresPlatformAdmin: true,
  },
  {
    id: 'page-platform-billing',
    label: 'Platform Admin — Billing',
    href: '/platform/setup/billing',
    icon: ReceiptIcon,
    requiresPlatformAdmin: true,
  },
  {
    id: 'page-platform-embedding',
    label: 'Platform Admin — Embedding',
    href: '/platform/security/signing-keys',
    icon: FrameIcon,
    requiresPlatformAdmin: true,
  },
  {
    id: 'page-platform-audit-logs',
    label: 'Platform Admin — Audit Logs',
    href: '/platform/security/audit-logs',
    icon: SquareDashedBottomCodeIcon,
    requiresPlatformAdmin: true,
  },
  {
    id: 'page-platform-sso',
    label: 'Platform Admin — Single Sign On',
    href: '/platform/security/sso',
    icon: LogInIcon,
    requiresPlatformAdmin: true,
  },
  {
    id: 'page-platform-project-roles',
    label: 'Platform Admin — Project Roles',
    href: '/platform/security/project-roles',
    icon: Settings2Icon,
    requiresPlatformAdmin: true,
  },
  {
    id: 'page-platform-api-keys',
    label: 'Platform Admin — API Keys',
    href: '/platform/security/api-keys',
    icon: FileJson2Icon,
    requiresPlatformAdmin: true,
  },
  {
    id: 'page-platform-secret-managers',
    label: 'Platform Admin — Secret Managers',
    href: '/platform/security/secret-managers',
    icon: KeyRoundIcon,
    requiresPlatformAdmin: true,
  },
  {
    id: 'page-platform-workers',
    label: 'Platform Admin — Workers',
    href: '/platform/infrastructure/workers',
    icon: ServerIcon,
    requiresPlatformAdmin: true,
  },
  {
    id: 'page-platform-health',
    label: 'Platform Admin — Health',
    href: '/platform/infrastructure/health',
    icon: FileHeartIcon,
    requiresPlatformAdmin: true,
  },
  {
    id: 'page-platform-triggers',
    label: 'Platform Admin — Triggers',
    href: '/platform/infrastructure/triggers',
    icon: MousePointerClickIcon,
    requiresPlatformAdmin: true,
  },
  {
    id: 'page-platform-event-streaming',
    label: 'Platform Admin — Event Streaming',
    href: '/platform/infrastructure/event-destinations',
    icon: WebhookIcon,
    requiresPlatformAdmin: true,
  },
  {
    id: 'page-platform-admin',
    label: 'Platform Admin',
    href: '/platform/projects',
    icon: ShieldIcon,
    requiresPlatformAdmin: true,
  },
];
