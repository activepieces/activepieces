import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { Maximize2, PanelLeft, PanelRight, Plus, X } from 'lucide-react';
import { memo, useState } from 'react';

import { AIChatBox } from '@/app/routes/chat-with-ai/ai-chat-box';
import { useEmbedding } from '@/components/providers/embed-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { chatConversations } from '@/features/chat/lib/chat-conversations';
import { chatQueryKeys } from '@/features/chat/lib/chat-query-keys';
import {
  chatPanelUtils,
  useChatPanel,
} from '@/features/workspace/lib/chat-panel-open';
import { windowSizeHooks } from '@/features/workspace/lib/window-size-hooks';

import { ChatSwitcher, ChatSwitcherOpener } from './chat-switcher';
import { useActiveConversationId, useChatWidth } from './chat-window';

export function ChatChrome() {
  const layout = useChatWidth();
  const conversationId = useActiveConversationId();
  const newChatToken = useChatPanel((s) => s.newChatToken);
  const pendingPrompt = useChatPanel((s) => s.pendingPrompt);
  const [typingId, setTypingId] = useState<string | null>(null);
  const [switcher, setSwitcher] = useState<SwitcherState>(SWITCHER_CLOSED);
  const full = layout === 'full';
  const chatShown = layout !== 'closed';

  if (!chatShown && switcher.open) {
    setSwitcher(SWITCHER_CLOSED);
  }

  const phone = windowSizeHooks.useIsPhone();
  const embedded = useEmbedding().embedState.isEmbedded;

  const openConversation = (id: string) => {
    if (full) {
      chatPanelUtils.showOnFullPage(id);
    } else {
      useChatPanel.getState().showConversation(id);
    }
  };

  const startFresh = () => {
    setSwitcher(SWITCHER_CLOSED);
    chatPanelUtils.startNewChat();
  };

  return (
    <>
      <div
        data-chat-header
        className="relative flex h-14 shrink-0 items-center gap-2 pr-3 pl-1 @chat-sm/chat:pl-4"
      >
        <div className="flex min-w-0 flex-1 items-center">
          <ChatSwitcher
            conversationId={conversationId}
            layout={full ? 'full' : 'dock'}
            typing={typingId !== null && typingId === conversationId}
            open={switcher.open}
            openedBy={switcher.openedBy}
            onOpenChange={setSwitcher}
            onSelect={openConversation}
          />
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <HeaderButton label={t('New chat')} onClick={startFresh}>
            <Plus />
          </HeaderButton>
          {!phone && !embedded && <LayoutMenu />}
          {!full && (
            <HeaderButton
              label={t('Close')}
              onClick={() => useChatPanel.getState().setOpen(false)}
            >
              <X />
            </HeaderButton>
          )}
        </div>
      </div>
      <div className="relative min-h-0 flex-1">
        <div className="h-full">
          <ChatBody
            full={full}
            conversationId={conversationId}
            newChatToken={newChatToken}
            prompt={pendingPrompt}
            onTitleTyped={setTypingId}
          />
        </div>
      </div>
    </>
  );
}

const ChatBody = memo(function ChatBody({
  full,
  conversationId,
  newChatToken,
  prompt,
  onTitleTyped,
}: {
  full: boolean;
  conversationId: string | null;
  newChatToken: number;
  prompt?: string;
  onTitleTyped: (conversationId: string) => void;
}) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient
      .invalidateQueries({ queryKey: chatQueryKeys.allConversationLists() })
      .catch(() => undefined);
  const showOnPage = (id: string | null) => {
    if (full) chatPanelUtils.showOnFullPage(id);
  };
  return (
    <AIChatBox
      key={newChatToken}
      incognito={false}
      conversationId={conversationId}
      initialPrompt={prompt}
      onConversationCreated={(id) => {
        useChatPanel.getState().conversationCreated(id);
        showOnPage(id);
        invalidate();
      }}
      onTitleUpdate={(next) => {
        const id = useChatPanel.getState().conversationId;
        if (id) {
          chatConversations.setTitle({ queryClient, id, title: next });
          onTitleTyped(id);
        }
        invalidate();
      }}
    />
  );
});

function LayoutMenu() {
  const layout = useChatWidth();
  const mode = useChatPanel((s) => s.mode);
  const current = layout === 'full' ? 'full' : mode;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <HeaderButton label={t('Chat layout')}>
          <PanelLeft />
        </HeaderButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-44"
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <DropdownMenuRadioGroup
          value={current}
          onValueChange={(value) => {
            if (value === current) return;
            if (value === 'full') {
              chatPanelUtils.expand();
            } else if (value === 'left' || value === 'right') {
              chatPanelUtils.collapse(value);
            }
          }}
        >
          <DropdownMenuRadioItem value="left">
            <PanelLeft className="size-4" />
            {t('On the left')}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="right">
            <PanelRight className="size-4" />
            {t('On the right')}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="full">
            <Maximize2 className="size-4" />
            {t('Full page')}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function HeaderButton({
  label,
  children,
  ...props
}: React.ComponentProps<typeof Button> & {
  label: string;
}) {
  return (
    <Tooltip delayDuration={HEADER_TOOLTIP_DELAY_MS}>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          className="text-gray-11 transition-colors duration-(--dur-micro) ease-[ease] hover:text-gray-12 active:bg-gray-5 aria-pressed:bg-gray-4 aria-pressed:text-gray-12 data-[state=open]:bg-gray-4 data-[state=open]:text-gray-12"
          {...props}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        sideOffset={4}
        className="pointer-events-none flex items-center gap-2"
      >
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

const HEADER_TOOLTIP_DELAY_MS = 500;
const SWITCHER_CLOSED: SwitcherState = { open: false, openedBy: 'pointer' };

type SwitcherState = { open: boolean; openedBy: ChatSwitcherOpener };
