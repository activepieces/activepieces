import { t } from 'i18next';
import { HistoryIcon, PanelLeftCloseIcon } from 'lucide-react';

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
    variant="ghost"
    size="icon-sm"
    aria-label={open ? t('Collapse conversations') : t('Expand conversations')}
    onClick={onClick}
    className="shrink-0 text-gray-11"
  >
    {open ? <PanelLeftCloseIcon /> : <HistoryIcon />}
  </Button>
);
