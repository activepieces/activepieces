import { t } from 'i18next';
import { X } from 'lucide-react';
import { useState } from 'react';

import { HistoryIcon } from '@/components/icons/history';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

import { ConversationList } from '../conversation-list';

// Chat history on mobile: the main app sidebar hosts the history on desktop, but on mobile
// that sidebar is an off-canvas Sheet with no trigger in the workspace shell, so the chat
// panel keeps its own slide-out history here.
export function ConversationSidebarToggle({
  onNewChat,
  onSelect,
  selectedId,
}: ConversationSidebarToggleProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
          <HistoryIcon size={18} />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        hideCloseButton
        className="flex w-[min(92vw,360px)] flex-col gap-0 p-0"
      >
        <SheetHeader className="flex-row items-center justify-between gap-2 space-y-0 border-b px-4 py-3">
          <SheetTitle className="text-sm font-semibold">
            {t('Chats')}
          </SheetTitle>
          <SheetClose asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <X size={16} />
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

type ConversationSidebarToggleProps = {
  onNewChat: () => void;
  onSelect: (id: string) => void;
  selectedId?: string | null;
};
