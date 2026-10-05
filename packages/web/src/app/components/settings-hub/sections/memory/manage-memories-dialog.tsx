import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { ArrowUp } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
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
        <DialogTitle>{t('Manage memory')}</DialogTitle>
        <DialogDescription>
          {t(
            'Here is what the assistant remembers about you across your chats. Add or remove anything below.',
          )}
        </DialogDescription>
      </DialogHeader>

      <div className="rounded-xl border p-1">
        <ScrollArea className="max-h-[45vh]">
          <RememberedFacts
            memories={memories}
            onForget={(index) =>
              forget.mutate(memories.filter((_, i) => i !== index))
            }
          />
        </ScrollArea>
      </div>

      <InputGroup>
        <InputGroupInput
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && instruction.trim().length > 0) {
              e.preventDefault();
              instruct.mutate();
            }
          }}
          placeholder={t('Tell me what to remember or forget')}
          disabled={instruct.isPending}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            variant="default"
            size="icon-xs"
            loading={instruct.isPending}
            disabled={instruction.trim().length === 0}
            onClick={() => instruct.mutate()}
          >
            <ArrowUp />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
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
      <DialogContent size="lg" overlayClassName="bg-scrim/40">
        <ManageMemoriesContent key={open ? 'open' : 'closed'} />
      </DialogContent>
    </Dialog>
  );
}
