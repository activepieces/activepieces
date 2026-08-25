import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { chatApi } from '@/features/chat/lib/chat-api';

import { useChatMemory, useChatMemoryActions } from './use-chat-memory';

function InstructionsEditor({ initial }: { initial: string | null }) {
  const { invalidate } = useChatMemoryActions();
  const [instructions, setInstructions] = useState(initial ?? '');
  const dirty = instructions !== (initial ?? '');

  const save = useMutation({
    mutationFn: () =>
      chatApi.saveMemory({ instructions: instructions.trim() || null }),
    onSuccess: () => {
      invalidate();
      toast.success(t('Instructions saved'));
    },
    onError: () => toast.error(t('Could not save instructions')),
  });

  return (
    <div className="space-y-3">
      <Textarea
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
        className="min-h-[130px]"
        placeholder={t(
          'For example: keep replies short and call me by my first name.',
        )}
      />
      {dirty && (
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            loading={save.isPending}
            onClick={() => save.mutate()}
          >
            {t('Save changes')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setInstructions(initial ?? '')}
          >
            {t('Discard')}
          </Button>
        </div>
      )}
    </div>
  );
}

export function GeneralSection() {
  const { data } = useChatMemory();

  return (
    <div className="space-y-6">
      <h2 className="text-base font-semibold tracking-tight">{t('General')}</h2>
      <div className="space-y-2">
        <div className="space-y-1">
          <p className="text-sm">{t('Personal instructions')}</p>
          <p className="text-sm text-muted-foreground">
            {t('The assistant keeps these in mind across all your chats.')}
          </p>
        </div>
        <InstructionsEditor
          key={data ? 'ready' : 'loading'}
          initial={data?.instructions ?? null}
        />
      </div>
    </div>
  );
}
