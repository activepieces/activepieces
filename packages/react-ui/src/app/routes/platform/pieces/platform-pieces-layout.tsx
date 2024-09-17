import { t } from 'i18next';
import { Brain, Puzzle } from 'lucide-react';

import SidebarLayout from '@/app/components/sidebar-layout';

const iconSize = 20;

const sidebarNavItems = [
  {
    title: 'All Pieces',
    href: '/platform/pieces',
    icon: <Puzzle size={iconSize} />,
  },
  {
    title: 'AI Providers',
    href: '/platform/pieces/ai',
    icon: <Brain size={iconSize} />,
  },
];

interface PiecesLayoutProps {
  children: React.ReactNode;
}

export function PlatformPiecesLayout({ children }: PiecesLayoutProps) {
  return (
    <SidebarLayout title={t('Pieces')} items={sidebarNavItems}>
      {children}
    </SidebarLayout>
  );
}
