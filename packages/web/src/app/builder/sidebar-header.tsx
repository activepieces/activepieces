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
    <div className="flex h-12 w-full shrink-0 items-center gap-2 border-b px-4 text-sm font-semibold">
      {leadingIcon && <div className="shrink-0">{leadingIcon}</div>}
      <div className="flex items-center gap-2 min-w-0 grow">{children}</div>
      {actions}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label={t('Close')}
      >
        <X />
      </Button>
    </div>
  );
};

export { SidebarHeader };
