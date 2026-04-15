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
          className="group relative overflow-hidden bg-gradient-to-r from-primary/10 to-violet-500/10 hover:from-primary/20 hover:to-violet-500/20 border border-primary/20 hover:border-primary/40 text-primary hover:text-primary transition-all duration-200 font-medium"
        >
          <Sparkles className="size-4 shrink-0 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-12" />
          <span>{t('Ask AI')}</span>
          <span className="absolute inset-0 rounded-md bg-gradient-to-r from-primary/5 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
