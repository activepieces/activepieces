import { t } from 'i18next';
import { Earth } from 'lucide-react';

import { Toggle } from '@/components/ui/toggle';
import { cn } from '@/lib/utils';

type WebSearchToolToggleProps = {
  toggleWebSearchTool: (enabled: boolean) => void;
  enabled: boolean;
};

export const WebSearchToolToggle = ({
  toggleWebSearchTool,
  enabled,
}: WebSearchToolToggleProps) => {
  return (
    <Toggle
      pressed={enabled}
      onPressedChange={toggleWebSearchTool}
      className={cn('gap-2')}
      size="sm"
    >
      <Earth className="size-4" />
      {t('Web Search')}
    </Toggle>
  );
};
