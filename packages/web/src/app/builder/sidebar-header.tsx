import { t } from 'i18next';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';

type SidebarHeaderProps = {
  children: React.ReactNode;
  onClose: () => void;
  leadingIcon?: React.ReactNode;
  actions?: React.ReactNode;
};
const SidebarHeader = ({
  children,
  onClose,
  leadingIcon,
  actions,
}: SidebarHeaderProps) => {
  return (
    <div className="flex px-3 py-2 w-full gap-2 text-base items-center min-h-[44px]">
      {leadingIcon && <div className="shrink-0">{leadingIcon}</div>}
      <div className="flex items-center gap-2 min-w-0 grow">{children}</div>
      {actions}
      <Button
        variant="ghost"
        size={'sm'}
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label={t('Close')}
      >
        <X size={16} />
      </Button>
    </div>
  );
};

export { SidebarHeader };
