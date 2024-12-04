import { t } from 'i18next';
import {
  Key,
  Lock,
  Palette,
  ShieldPlus,
  CreditCard,
  ScrollText,
  Monitor,
  Sparkles,
  Workflow,
  Link,
  Puzzle,
  ScanFace,
  HeartPulse,
} from 'lucide-react';

import SidebarLayout, { SidebarItem } from '@/app/components/sidebar-layout';
import { flagsHooks } from '@/hooks/flags-hooks';
import { ApFlagId } from '@activepieces/shared';

const iconSize = 20;

interface SecondSidebarProps {
  children: React.ReactNode;
  type: 'setup' | 'infrastructure' | 'security';
}

interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

export default function PlatformSecondSidebarLayout({
  children,
  type,
}: SecondSidebarProps) {
  const { data: showPlatformDemo } = flagsHooks.useFlag(
    ApFlagId.SHOW_PLATFORM_DEMO,
  );

  const sidebarNavItems: Record<string, SidebarSection> = {
    setup: {
      title: t('Setup'),
      items: [
        {
          title: t('Universal AI'),
          href: '/platform/setup/ai',
          icon: <Sparkles size={iconSize} />,
        },
        {
          title: t('Branding'),
          href: '/platform/setup/branding',
          icon: <Palette size={iconSize} />,
        },
        {
          title: t('Global Connections'),
          href: '/platform/setup/connections',
          icon: <Link size={iconSize} />,
        },
        {
          title: t('Pieces'),
          href: '/platform/setup/pieces',
          icon: <Puzzle size={iconSize} />,
        },
        {
          title: t('Templates'),
          href: '/platform/setup/templates',
          icon: <Workflow size={iconSize} />,
        },
      ],
    },
    security: {
      title: t('Security'),
      items: [
        {
          title: t('Audit Logs'),
          href: '/platform/security/audit-logs',
          icon: <ScrollText size={iconSize} />,
        },
        {
          title: t('Single Sign On'),
          href: '/platform/security/sso',
          icon: <ShieldPlus size={iconSize} />,
        },
        {
          title: t('Signing Keys'),
          href: '/platform/security/signing-keys',
          icon: <Lock size={iconSize} />,
        },
        {
          title: t('Project Roles'),
          href: '/platform/security/project-roles',
          icon: <ScanFace size={iconSize} />,
        },
        {
          title: t('API Keys'),
          href: '/platform/security/api-keys',
          icon: <Key size={iconSize} />,
        },
      ],
    },
    infrastructure: {
      title: t('Infrastructure'),
      items: [
        {
          title: t('Workers'),
          href: '/platform/infrastructure/workers',
          icon: <Monitor size={iconSize} />,
        },
        {
          title: t('Health'),
          href: '/platform/infrastructure/health',
          icon: <HeartPulse size={iconSize} />,
        },
      ],
    },
  };

  if (!showPlatformDemo) {
    sidebarNavItems['setup'].items.push({
      title: 'License Key',
      href: '/platform/setup/license-key',
      icon: <CreditCard size={iconSize} />,
    });
  }

  return (
    <SidebarLayout
      title={sidebarNavItems[type].title}
      items={sidebarNavItems[type].items}
    >
      {children}
    </SidebarLayout>
  );
}
