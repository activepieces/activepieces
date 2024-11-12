import { t } from 'i18next';
import {
  Key,
  Lock,
  Palette,
  ShieldPlus,
  CreditCard,
  ScrollText,
  UserCog,
  Sparkles,
} from 'lucide-react';

import SidebarLayout from '@/app/components/sidebar-layout';
import { flagsHooks } from '@/hooks/flags-hooks';
import { ApFlagId } from '@activepieces/shared';

const iconSize = 20;

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function PlatformSettingsLayout({
  children,
}: SettingsLayoutProps) {
  const { data: showPlatformDemo } = flagsHooks.useFlag(
    ApFlagId.SHOW_PLATFORM_DEMO,
  );

  const sidebarNavItems = [
    {
      title: t('Branding'),
      href: '/platform/settings/branding',
      icon: <Palette size={iconSize} />,
    },
    {
      title: t('Universal AI'),
      href: '/platform/settings/ai',
      icon: <Sparkles size={iconSize} />,
    },
    {
      title: t('API Keys'),
      href: '/platform/settings/api-keys',
      icon: <Key size={iconSize} />,
    },
    {
      title: t('Single Sign On'),
      href: '/platform/settings/sso',
      icon: <ShieldPlus size={iconSize} />,
    },
    {
      title: t('Signing Keys'),
      href: '/platform/settings/signing-keys',
      icon: <Lock size={iconSize} />,
    },
    {
      title: t('Users'),
      href: '/platform/settings/users',
      icon: <UserCog size={iconSize} />,
    },
    {
      title: t('Audit Logs'),
      href: '/platform/settings/audit-logs',
      icon: <ScrollText size={iconSize} />,
    },
  ];

  if (!showPlatformDemo) {
    sidebarNavItems.push({
      title: 'License Key',
      href: '/platform/settings/license-key',
      icon: <CreditCard size={iconSize} />,
    });
  }

  return (
    <SidebarLayout title={t('Settings')} items={sidebarNavItems}>
      {children}
    </SidebarLayout>
  );
}
