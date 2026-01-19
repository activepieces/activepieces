import { t } from 'i18next';
import { Earth } from 'lucide-react';

import { Toggle } from '@/components/ui/toggle';
import { chatHooks } from '@/features/chat-v2/lib/chat-hooks';
import { useChatSessionStore } from '@/features/chat-v2/store';
import { cn } from '@/lib/utils';
import { isNil } from '@activepieces/shared';

export const WebSearchToolToggle = () => {
  const { session, setSession } = useChatSessionStore();
  const { mutate: toggleSearchTool, isPending: togglingSearchTool } =
    chatHooks.useToggleSearchTool(setSession);

  const searchEnabled = !isNil(session?.webSearchEnabled)
    ? session.webSearchEnabled
    : true;

  const handleToggleWebSearchTool = (enabled: boolean) => {
    toggleSearchTool({
      enabled: enabled,
      currentSession: isNil(session) ? null : session,
    });
  };

  return (
    <Toggle
      pressed={searchEnabled}
      onPressedChange={handleToggleWebSearchTool}
      disabled={togglingSearchTool}
      className={cn('gap-2', searchEnabled && '!text-primary')}
      size="sm"
    >
      <Earth className="size-4" />
      {t('Search')}
    </Toggle>
  );
};
