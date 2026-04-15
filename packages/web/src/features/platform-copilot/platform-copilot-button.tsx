import { t } from 'i18next';
import { Sparkles } from 'lucide-react';

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar-shadcn';

type PlatformCopilotButtonProps = {
  onClick: () => void;
};

export function PlatformCopilotButton({ onClick }: PlatformCopilotButtonProps) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton onClick={onClick} tooltip={t('Ask AI')}>
          <Sparkles className="size-4" />
          <span>{t('Ask AI')}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
