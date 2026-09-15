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
    variant="outline"
    size="icon"
    aria-label={open ? t('Collapse conversations') : t('Expand conversations')}
    onClick={onClick}
    className="size-[30px] shrink-0 text-muted-foreground"
  >
    {open ? <PanelLeftCloseIcon size={14} /> : <HistoryIcon size={14} />}
  </Button>
);
