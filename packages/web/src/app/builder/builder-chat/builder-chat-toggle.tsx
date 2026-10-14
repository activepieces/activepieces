import { t } from 'i18next';
import { MessageSquare } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { useBuilderStateContext } from '../builder-hooks';

import { useToggleBuilderChat } from './use-toggle-builder-chat';

export function BuilderChatToggle() {
  const isBuilderChatOpen = useBuilderStateContext(
    (state) => state.isBuilderChatOpen,
  );
  const toggleBuilderChat = useToggleBuilderChat();
  return (
    <Button
      variant={isBuilderChatOpen ? 'secondary' : 'ghost'}
      onClick={() => toggleBuilderChat(!isBuilderChatOpen)}
    >
      <MessageSquare className="w-4 h-4" />
      {t('Chat')}
    </Button>
  );
}
