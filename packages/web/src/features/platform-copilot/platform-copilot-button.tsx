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
        <SidebarMenuButton
          onClick={onClick}
          tooltip={t('Ask AI')}
          className="gap-2.5 text-primary hover:text-primary hover:bg-primary/8 font-medium"
        >
          <Sparkles className="size-4 shrink-0" />
          <span>{t('Ask AI')}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
