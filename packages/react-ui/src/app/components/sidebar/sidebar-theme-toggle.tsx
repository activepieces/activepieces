import { t } from 'i18next';
import { Monitor, Moon, Sun } from 'lucide-react';

import { useTheme } from '@/components/theme-provider';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar-shadcn';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function SidebarThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const cycleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="w-4 h-4" />;
      case 'dark':
        return <Moon className="w-4 h-4" />;
      case 'system':
        return <Monitor className="w-4 h-4" />;
      default:
        return <Sun className="w-4 h-4" />;
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return t('Light');
      case 'dark':
        return t('Dark');
      case 'system':
        return t('System');
      default:
        return t('Light');
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        {isCollapsed ? (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarMenuButton onClick={cycleTheme} size="lg" className="px-0 justify-center items-center ml-1">
                  {getThemeIcon()}
                </SidebarMenuButton>
              </TooltipTrigger>
              <TooltipContent side="right" align="center">
                {getThemeLabel()}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <SidebarMenuButton onClick={cycleTheme} size="lg" className="px-2">
            <div className="flex items-center gap-2 w-full text-left text-sm">
              {getThemeIcon()}
              <span>{getThemeLabel()}</span>
            </div>
          </SidebarMenuButton>
        )}
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
