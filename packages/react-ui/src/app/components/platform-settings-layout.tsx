import { t } from 'i18next';
import { Key, Lock, Palette, ShieldPlus, CreditCard } from 'lucide-react';

import SidebarLayout from '@/app/components/sidebar-layout';
import { flagsHooks } from '@/hooks/flags-hooks';
import { ApFlagId } from '../../../../shared/src';

const iconSize = 20;

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function PlatformSettingsLayout({
  children,
}: SettingsLayoutProps) {
  const { data: showPlatformDemo } = flagsHooks.useFlag(ApFlagId.SHOW_PLATFORM_DEMO)
  
  const sidebarNavItems = [
    {
      title: t('Branding'),
      href: '/platform/settings/branding',
      icon: <Palette size={iconSize} />,
    },
    {
      title: t('API Keys'),
      href: '/platform/settings/api-keys',
      icon: <Key size={iconSize} />,
    },
    {
      title: t('Signing Keys'),
      href: '/platform/settings/signing-keys',
      icon: <Lock size={iconSize} />,
    },
    {
      title: 'Single Sign On',
      href: '/platform/settings/sso',
      icon: <ShieldPlus size={iconSize} />,
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
