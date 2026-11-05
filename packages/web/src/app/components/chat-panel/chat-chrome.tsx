import { t } from 'i18next';
import {
  Maximize2,
  PanelLeft,
  PanelRight,
  PictureInPicture2,
  Plus,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { AIChatBox } from '@/app/routes/chat-with-ai/ai-chat-box';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChatPanelMode,
  useChatPanel,
} from '@/features/workspace/lib/chat-panel-open';
import { CHAT_ROUTE } from '@/lib/route-utils';

import { ChatPanelEmptyState } from './chat-panel-empty-state';
import { defaultFloat, FLOAT_DEFAULT, fitToWindow } from './chat-window';

// The panel's header and the chat itself. Rendered once, above the routes, by
// ChatChromeHost, so it survives page changes.
export function ChatChrome({
  onDragStart,
}: {
  onDragStart: (event: React.PointerEvent<HTMLElement>) => void;
}) {
  const navigate = useNavigate();
  const { conversationId, setConversationId, setOpen } = useChatPanel();
  // The chat box reads its conversation once, when it mounts. A new session
  // starts it fresh; a conversation it creates is only remembered.
  const [session, setSession] = useState<ChatSession>({
    key: 0,
    conversationId,
  });
  const startFresh = (prompt?: string) => {
    setConversationId(null);
    setSession((s) => ({ key: s.key + 1, conversationId: null, prompt }));
  };

  return (
    <>
      <div
        onPointerDown={onDragStart}
        className="group/header relative flex h-14 shrink-0 cursor-grab touch-none items-center gap-0.5 pr-3 pl-4 select-none"
      >
        <span
          aria-hidden
          className="absolute top-1.5 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-gray-5 transition-colors duration-150 group-hover/header:bg-gray-8"
        />
        <h2 className="grow text-base font-semibold">{t('Chat')}</h2>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t('New chat')}
          title={t('New chat')}
          onClick={() => startFresh()}
        >
          <Plus className="size-4" />
        </Button>
        <LayoutMenu
          onOpenFullPage={() => {
            setOpen(false);
            navigate(
              conversationId ? `${CHAT_ROUTE}/${conversationId}` : CHAT_ROUTE,
            );
          }}
        />
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t('Close')}
          title={t('Close')}
          onClick={() => setOpen(false)}
        >
          <X className="size-4" />
        </Button>
      </div>
      <div className="min-h-0 flex-1">
        <AIChatBox
          key={session.key}
          incognito={false}
          compact
          conversationId={session.conversationId}
          initialPrompt={session.prompt}
          onConversationCreated={setConversationId}
          emptyState={<ChatPanelEmptyState onPick={startFresh} />}
        />
      </div>
    </>
  );
}

const LAYOUTS: {
  mode: ChatPanelMode;
  label: string;
  icon: typeof PanelLeft;
}[] = [
  { mode: 'left', label: 'Dock left', icon: PanelLeft },
  { mode: 'right', label: 'Dock right', icon: PanelRight },
  { mode: 'float', label: 'Floating', icon: PictureInPicture2 },
];

// The button shows where the panel sits now; its menu moves it, or hands the
// conversation to the full chat page.
function LayoutMenu({ onOpenFullPage }: { onOpenFullPage: () => void }) {
  const { mode, float, floatSize, dock, floatAt } = useChatPanel();
  const CurrentIcon =
    LAYOUTS.find((layout) => layout.mode === mode)?.icon ?? PanelLeft;

  const moveTo = (next: string) => {
    if (next === 'left' || next === 'right') {
      dock(next);
      return;
    }
    const size = fitToWindow(floatSize ?? FLOAT_DEFAULT);
    floatAt(float ?? defaultFloat(size));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t('Panel layout')}
          title={t('Panel layout')}
        >
          <CurrentIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuRadioGroup value={mode} onValueChange={moveTo}>
          {LAYOUTS.map(({ mode: layout, label, icon: Icon }) => (
            <DropdownMenuRadioItem key={layout} value={layout}>
              <Icon className="size-4" />
              {t(label)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onOpenFullPage} className="pl-8">
          <Maximize2 className="size-4" />
          {t('Open full page')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type ChatSession = {
  key: number;
  conversationId: string | null;
  prompt?: string;
};
