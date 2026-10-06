import { HistoryIcon, SidebarLeft01Icon } from '@hugeicons/core-free-icons';
import { t } from 'i18next';

import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
import { Button } from '@/components/ui/button';

export const ConversationsToggle = ({
  open,
  onClick,
}: {
  open: boolean;
  onClick: () => void;
}) => (
  <Button
    type="button"
    variant="outline"
    size="icon"
    aria-label={open ? t('Collapse conversations') : t('Expand conversations')}
    onClick={onClick}
    className="size-[30px] shrink-0 text-gray-11"
  >
    {open ? (
      <HugeiconsIcon icon={SidebarLeft01Icon} size={14} />
    ) : (
      <HugeiconsIcon icon={HistoryIcon} size={14} />
    )}
  </Button>
);
