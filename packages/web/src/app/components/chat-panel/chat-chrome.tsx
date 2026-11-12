import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import {
  ArrowLeft,
  History,
  Maximize2,
  PanelLeft,
  PanelRight,
  Plus,
  X,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { memo, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

import { AIChatBox } from '@/app/routes/chat-with-ai/ai-chat-box';
import { ChatAppLinks } from '@/app/routes/chat-with-ai/components/chat-app-links';
import { Shortcut, ShortcutProps } from '@/components/custom/shortcut';
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
import { chatDom } from '@/features/chat/lib/chat-dom';
import { chatQueryKeys } from '@/features/chat/lib/chat-query-keys';
import { MOTION } from '@/features/workspace/lib/chat-layout';
import {
  chatPanelUtils,
  useChatPanel,
} from '@/features/workspace/lib/chat-panel-open';
import { windowSizeHooks } from '@/features/workspace/lib/window-size-hooks';
import { cn } from '@/lib/utils';

import { ChatHistoryList } from './chat-history-list';
import { historyMotion } from './chat-history-motion';
import { ChatSwitcher, ChatSwitcherOpener } from './chat-switcher';
import {
  useActiveConversationId,
  useChatSheet,
  useChatWidth,
} from './chat-window';

export function ChatChrome() {
  const full = useChatWidth() === 'full';
  const phone = windowSizeHooks.useIsPhone();
  const railed = full && !phone;
  const conversationId = useActiveConversationId();
  const reduced = useReducedMotion();
  const [railOpen, setRailOpen] = useState(true);
  return (
    <div className={full ? 'flex min-h-0 flex-1' : 'contents'}>
      <AnimatePresence initial={false}>
        {railed && railOpen && (
          <motion.aside
            key="chats"
            data-chat-rail=""
            aria-label={t('Chats')}
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: RAIL_WIDTH_PX, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{
              duration: reduced ? 0 : MOTION.move,
              ease: MOTION.easeOut,
            }}
            className="shrink-0 overflow-hidden border-r bg-gray-1"
          >
            <div
              style={{ width: RAIL_WIDTH_PX }}
              className="flex h-full flex-col"
            >
              <div className="flex h-14 shrink-0 items-center gap-2 pr-3 pl-4">
                <RailToggle open onOpenChange={setRailOpen} />
                <h2 className="min-w-0 flex-1 truncate text-sm font-medium text-gray-12">
                  {t('Chats')}
                </h2>
                <NewChatButton onClick={chatPanelUtils.startNewChat} />
              </div>
              <div className="min-h-0 flex-1">
                <ChatHistoryList
                  selectedId={conversationId}
                  onSelect={chatPanelUtils.showOnFullPage}
                  onCurrentDeleted={chatPanelUtils.startNewChat}
                />
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
      <div className={full ? 'flex min-w-0 flex-1 flex-col' : 'contents'}>
        <ChatPane railOpen={railOpen} onRailOpenChange={setRailOpen} />
      </div>
    </div>
  );
}

function ChatPane({
  railOpen,
  onRailOpenChange,
}: {
  railOpen: boolean;
  onRailOpenChange: (open: boolean) => void;
}) {
  const layout = useChatWidth();
  const conversationId = useActiveConversationId();
  const newChatToken = useChatPanel((s) => s.newChatToken);
  const pendingPrompt = useChatPanel((s) => s.pendingPrompt);
  const [typingId, setTypingId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [switcher, setSwitcher] = useState<SwitcherState>(SWITCHER_CLOSED);
  const reduced = useReducedMotion();
  const full = layout === 'full';
  const sheet = layout === 'sheet';
  const chatShown = layout !== 'closed';
  const phone = windowSizeHooks.useIsPhone();
  const railed = full && !phone;

  if (railed && historyOpen) {
    setHistoryOpen(false);
  }

  if (!chatShown && (historyOpen || switcher.open)) {
    setHistoryOpen(false);
    setSwitcher(SWITCHER_CLOSED);
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (chatDom.shortcutOf(event) === 'history') {
        event.preventDefault();
        if (!chatShown) {
          useChatPanel.getState().setOpen(true);
          setSwitcher({ open: true, openedBy: 'keyboard' });
          return;
        }
        if (railed) {
          onRailOpenChange(!railOpen);
          if (!railOpen) requestAnimationFrame(focusRailSearch);
          return;
        }
        setHistoryOpen(false);
        setSwitcher((current) => ({
          open: !current.open,
          openedBy: 'keyboard',
        }));
        return;
      }
      if (
        chatShown &&
        event.key === 'Escape' &&
        historyOpen &&
        chatDom.inChat(document.activeElement) &&
        chatDom.escapeFree(event)
      ) {
        chatDom.claimEscape(event);
        setHistoryOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [chatShown, historyOpen, railed, railOpen, onRailOpenChange]);
  const embedded = useEmbedding().embedState.isEmbedded;
  const chatSheet = useChatSheet();

  const openConversation = (id: string) => {
    setHistoryOpen(false);
    if (full) {
      chatPanelUtils.showOnFullPage(id);
    } else {
      useChatPanel.getState().showConversation(id);
    }
  };

  const startFresh = () => {
    setHistoryOpen(false);
    setSwitcher(SWITCHER_CLOSED);
    chatPanelUtils.startNewChat();
  };

  return (
    <>
      <div
        data-chat-header
        className={cn(
          'relative flex h-14 shrink-0 items-center gap-2 pr-3 pl-1 @chat-sm/chat:pl-4',
          sheet && 'touch-none select-none',
        )}
      >
        {sheet && (
          <span
            aria-hidden
            className="absolute top-2 left-1/2 h-1 w-9 -translate-x-1/2 rounded-full bg-gray-6"
          />
        )}
        <div className="flex min-w-0 flex-1 items-center gap-1">
          {historyOpen ? (
            <motion.div
              key="history"
              {...titleFade()}
              className="flex min-w-0 items-center gap-1"
            >
              <Button
                variant="ghost"
                size="icon-sm"
                autoFocus
                aria-label={t('Back to chat')}
                onClick={() => {
                  flushSync(() => setHistoryOpen(false));
                  chatDom.composer()?.focus();
                }}
                className="text-gray-11 hover:text-gray-12"
              >
                <ArrowLeft />
              </Button>
              <h2 className="truncate text-sm font-medium text-gray-12">
                {t('History')}
              </h2>
            </motion.div>
          ) : (
            <>
              {railed && !railOpen && (
                <>
                  <RailToggle open={false} onOpenChange={onRailOpenChange} />
                  <NewChatButton onClick={startFresh} />
                </>
              )}
              <ChatSwitcher
                conversationId={conversationId}
                layout={railed ? 'full' : sheet ? 'sheet' : 'dock'}
                typing={typingId !== null && typingId === conversationId}
                open={switcher.open}
                openedBy={switcher.openedBy}
                onOpenChange={setSwitcher}
                onSelect={openConversation}
                onShowAll={() =>
                  railed ? onRailOpenChange(true) : setHistoryOpen(true)
                }
                onTitleEdited={() => setTypingId(null)}
              />
            </>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {!railed && <NewChatButton onClick={startFresh} />}
          {!phone && !embedded && <LayoutMenu />}
          {!full && (
            <HeaderButton
              label={t('Close')}
              shortcut={TOGGLE_SHORTCUT}
              onClick={() =>
                sheet
                  ? chatSheet.hide()
                  : useChatPanel.getState().setOpen(false)
              }
            >
              <X />
            </HeaderButton>
          )}
        </div>
      </div>
      <div className="relative min-h-0 flex-1">
        <AnimatePresence initial={false}>
          {historyOpen && (
            <motion.div
              key="history"
              {...historyMotion.enter({
                reduced,
                instant: switcher.openedBy === 'keyboard',
              })}
              className="absolute inset-0 z-10 bg-gray-1"
            >
              <ChatHistoryList
                selectedId={conversationId}
                onSelect={openConversation}
                onCurrentDeleted={chatPanelUtils.startNewChat}
              />
            </motion.div>
          )}
        </AnimatePresence>
        <div inert={historyOpen} className="h-full">
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
    <ChatAppLinks>
      <AIChatBox
        key={newChatToken}
        incognito={false}
        compact={!full}
        autoFocusComposer={newChatToken > 0}
        conversationId={conversationId}
        initialPrompt={prompt}
        onConversationCreated={(id) => {
          useChatPanel.getState().conversationCreated(id);
          showOnPage(id);
          invalidate();
        }}
        onConversationMissing={() => {
          useChatPanel.getState().conversationMissing();
          showOnPage(null);
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
    </ChatAppLinks>
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

function focusRailSearch() {
  document
    .querySelector<HTMLElement>(
      '[data-chat-rail] input, [data-chat-rail] li button',
    )
    ?.focus();
}

function RailToggle({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <HeaderButton
      label={open ? t('Hide chats') : t('Show chats')}
      aria-pressed={open}
      onClick={() => onOpenChange(!open)}
    >
      <History />
    </HeaderButton>
  );
}

function NewChatButton({ onClick }: { onClick: () => void }) {
  return (
    <HeaderButton
      label={t('New chat')}
      shortcut={NEW_CHAT_SHORTCUT}
      onClick={onClick}
    >
      <Plus />
    </HeaderButton>
  );
}

function HeaderButton({
  label,
  shortcut,
  children,
  ...props
}: React.ComponentProps<typeof Button> & {
  label: string;
  shortcut?: ShortcutProps;
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
        {shortcut && <Shortcut variant="compact" {...shortcut} />}
      </TooltipContent>
    </Tooltip>
  );
}

const HEADER_TOOLTIP_DELAY_MS = 500;
const RAIL_WIDTH_PX = 288;
const TOGGLE_SHORTCUT: ShortcutProps = { shortcutKey: 'J', withCtrl: true };
const NEW_CHAT_SHORTCUT: ShortcutProps = {
  shortcutKey: 'O',
  withCtrl: true,
  withShift: true,
};
const SWITCHER_CLOSED: SwitcherState = { open: false, openedBy: 'pointer' };

function titleFade() {
  return {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: { duration: MOTION.base, ease: MOTION.easeOut },
    },
  };
}

type SwitcherState = { open: boolean; openedBy: ChatSwitcherOpener };
