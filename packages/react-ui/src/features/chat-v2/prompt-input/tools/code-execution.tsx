import { t } from 'i18next';
import { Code } from 'lucide-react';

import { Toggle } from '@/components/ui/toggle';
import { chatHooks } from '@/features/chat-v2/lib/chat-hooks';
import { useChatSessionStore } from '@/features/chat-v2/store';
import { cn } from '@/lib/utils';
import { isNil } from '@activepieces/shared';

export const CodeExecutionToolToggle = () => {
  const { session, setSession } = useChatSessionStore();
  const { mutate: updateChatSession, isPending: updatingSession } =
    chatHooks.useUpdateChatSession(setSession);

  const codeExecutionEnabled = !isNil(session?.codeExecutionEnabled)
    ? session.codeExecutionEnabled
    : true;

  const handleToggleCodeExecution = (enabled: boolean) => {
    updateChatSession({
      codeExecutionEnabled: enabled,
      currentSession: isNil(session) ? null : session,
    });
  };

  return (
    <Toggle
      pressed={codeExecutionEnabled}
      onPressedChange={handleToggleCodeExecution}
      disabled={updatingSession}
      className={cn('gap-2', codeExecutionEnabled && '!text-primary')}
      size="sm"
    >
      <Code className="size-4" />
      {t('Code')}
    </Toggle>
  );
};

