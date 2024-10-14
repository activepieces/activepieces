import { t } from 'i18next';
import { Key, Lock, Palette, ShieldPlus, CreditCard } from 'lucide-react';

import SidebarLayout from '@/app/components/sidebar-layout';

const iconSize = 20;

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
  {
    title: 'License Keys',
    href: '/platform/settings/license-key',
    icon: <CreditCard size={iconSize} />,
  },
];

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function PlatformSettingsLayout({
  children,
}: SettingsLayoutProps) {
  return (
    <SidebarLayout title={t('Settings')} items={sidebarNavItems}>
      {children}
    </SidebarLayout>
  );
}
