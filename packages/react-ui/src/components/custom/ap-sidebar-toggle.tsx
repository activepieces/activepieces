import { t } from 'i18next';
import { PanelRightClose, PanelRightOpen } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar-shadcn';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export const ApSidebarToggle = () => {
  const { open, setOpen } = useSidebar();
  return (
    <Tooltip>
      <TooltipTrigger>
        <Button variant="ghost" size="icon" onClick={() => setOpen(!open)}>
          {open ? <PanelRightOpen /> : <PanelRightClose />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {open ? t('Close Sidebar') : t('Open Sidebar')}
      </TooltipContent>
    </Tooltip>
  );
};
