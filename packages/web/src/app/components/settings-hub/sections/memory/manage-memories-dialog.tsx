import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { ArrowUp } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { chatApi } from '@/features/chat/lib/chat-api';

import { RememberedFacts } from './remembered-facts';
import { useChatMemory, useChatMemoryActions } from './use-chat-memory';

function ManageMemoriesContent() {
  const { data } = useChatMemory();
  const { invalidate } = useChatMemoryActions();
  const [instruction, setInstruction] = useState('');
  const memories = data?.memories ?? [];

  const instruct = useMutation({
    mutationFn: () => chatApi.instructMemory({ instruction }),
    onSuccess: () => {
      setInstruction('');
      invalidate();
    },
    onError: () => toast.error(t('Could not update memory')),
  });

  const forget = useMutation({
    mutationFn: (next: string[]) => chatApi.saveMemory({ memories: next }),
    onSuccess: invalidate,
    onError: () => toast.error(t('Could not update memory')),
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-xl">{t('Manage memory')}</DialogTitle>
        <DialogDescription>
          {t(
            'Here is what the assistant remembers about you across your chats. Add or remove anything below.',
          )}
        </DialogDescription>
      </DialogHeader>

      <div className="rounded-lg border p-2">
        <ScrollArea className="max-h-[45vh] pr-2">
          <RememberedFacts
            memories={memories}
            onForget={(index) =>
              forget.mutate(memories.filter((_, i) => i !== index))
            }
          />
        </ScrollArea>
      </div>

      <div className="relative">
        <Input
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && instruction.trim().length > 0) {
              e.preventDefault();
              instruct.mutate();
            }
          }}
          placeholder={t('Tell me what to remember or forget')}
          className="h-11 rounded-full pl-4 pr-12"
          disabled={instruct.isPending}
        />
        <Button
          type="button"
          size="icon"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
          loading={instruct.isPending}
          disabled={instruction.trim().length === 0}
          onClick={() => instruct.mutate()}
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      </div>
    </>
  );
}

export function ManageMemoriesDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl gap-5" overlayClassName="bg-black/20">
        <ManageMemoriesContent key={open ? 'open' : 'closed'} />
      </DialogContent>
    </Dialog>
  );
}
