import { t } from 'i18next';
import { X } from 'lucide-react';
import { useState } from 'react';

import { HistoryIcon } from '@/components/icons/history';
import { PanelLeftCloseIcon } from '@/components/icons/panel-left-close';
import { Button } from '@/components/ui/button';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { ConversationList } from '../conversation-list';

export function ConversationSidebarToggle({
  pinned,
  isMobile,
  onTogglePin,
  onNewChat,
  onSelect,
  selectedId,
}: ConversationSidebarToggleProps) {
  const [open, setOpen] = useState(false);

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="shrink-0">
            <HistoryIcon />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="flex w-[min(92vw,360px)] flex-col gap-0 p-0"
        >
          <SheetHeader className="flex-row items-center justify-between gap-2 border-b px-4 py-3">
            <SheetTitle className="text-sm font-semibold">
              {t('Chats')}
            </SheetTitle>
            <SheetClose asChild>
              <Button variant="ghost" size="icon-sm" className="shrink-0">
                <X />
              </Button>
            </SheetClose>
          </SheetHeader>
          <SheetDescription className="sr-only">
            {t('Your chat history')}
          </SheetDescription>
          <ConversationList
            mobile
            className="w-full flex-1 min-h-0 h-auto"
            onNewChat={() => {
              setOpen(false);
              onNewChat();
            }}
            onSelect={(id) => {
              setOpen(false);
              onSelect(id);
            }}
            selectedId={selectedId}
          />
        </SheetContent>
      </Sheet>
    );
  }

  if (pinned) {
    return (
      <TooltipProvider delayDuration={400}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="shrink-0"
              onClick={onTogglePin}
            >
              <PanelLeftCloseIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('Collapse sidebar')}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <HoverCard openDelay={120} closeDelay={120}>
      <HoverCardTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="shrink-0"
          onClick={onTogglePin}
        >
          <HistoryIcon />
        </Button>
      </HoverCardTrigger>
      <HoverCardContent
        side="bottom"
        align="start"
        sideOffset={8}
        className="flex max-h-[70vh] w-60 flex-col overflow-hidden p-0"
      >
        <ConversationList
          className="w-full"
          onNewChat={onNewChat}
          onSelect={onSelect}
          selectedId={selectedId}
        />
      </HoverCardContent>
    </HoverCard>
  );
}

type ConversationSidebarToggleProps = {
  pinned: boolean;
  isMobile: boolean;
  onTogglePin: () => void;
  onNewChat: () => void;
  onSelect: (id: string) => void;
  selectedId?: string | null;
};
