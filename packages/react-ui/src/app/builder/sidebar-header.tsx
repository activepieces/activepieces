import { t } from 'i18next';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';

type SidebarHeaderProps = {
  children: React.ReactNode;
  onClose: () => void;
};
const SidebarHeader = ({ children, onClose }: SidebarHeaderProps) => {
  return (
    <div className="flex p-4 w-full justify-between items-center">
      <div className="font-semibold flex-grow text-lg">{children}</div>
      <Button
        variant="ghost"
        size={'sm'}
        onClick={onClose}
        aria-label={t('Close')}
      >
        <X size={16} />
      </Button>
    </div>
  );
};

export { SidebarHeader };
