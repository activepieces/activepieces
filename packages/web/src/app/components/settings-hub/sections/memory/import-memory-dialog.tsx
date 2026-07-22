import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useState } from 'react';
import { toast } from 'sonner';

import { CopyButton } from '@/components/custom/clipboard/copy-button';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { chatApi } from '@/features/chat/lib/chat-api';

import { useChatMemoryActions } from './use-chat-memory';

const EXPORT_PROMPT = `Export everything you know about me from our past conversations — my stored memories and any context you've learned. Include how I like to work, my tone and communication preferences, standing instructions, and durable facts about me and my projects. Preserve my exact words where possible, especially for instructions and preferences. Return it as a plain list.`;

function Step({
  number,
  title,
  last,
  children,
}: {
  number: number;
  title: string;
  last?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
          {number}
        </span>
        {!last && <span className="mt-1 w-px flex-1 bg-border" />}
      </div>
      <div className={last ? 'flex-1 space-y-3' : 'flex-1 space-y-3 pb-6'}>
        <p className="text-sm font-medium">{title}</p>
        {children}
      </div>
    </div>
  );
}

function ImportMemoryContent({ onClose }: { onClose: () => void }) {
  const { invalidate } = useChatMemoryActions();
  const [text, setText] = useState('');

  const runImport = useMutation({
    mutationFn: () => chatApi.importMemory({ text }),
    onSuccess: () => {
      invalidate();
      toast.success(t('Memory imported'));
      onClose();
    },
    onError: () => toast.error(t('Could not read the pasted memory')),
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-xl">{t('Import memory')}</DialogTitle>
      </DialogHeader>

      <div className="space-y-1 py-2">
        <Step
          number={1}
          title={t('Copy this prompt into a chat with your other AI provider')}
        >
          <div className="relative rounded-lg border bg-muted/40 p-4">
            <p className="max-h-28 overflow-hidden whitespace-pre-wrap pr-12 text-sm text-muted-foreground [mask-image:linear-gradient(to_bottom,black_55%,transparent)]">
              {EXPORT_PROMPT}
            </p>
            <CopyButton
              textToCopy={EXPORT_PROMPT}
              variant="outline"
              className="absolute right-3 top-3 h-8 w-8"
            />
          </div>
        </Step>
        <Step
          number={2}
          title={t('Paste the results below to add to your memory')}
          last
        >
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[180px]"
            placeholder={t('Paste your memory details here')}
          />
        </Step>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          {t('Cancel')}
        </Button>
        <Button
          type="button"
          loading={runImport.isPending}
          disabled={text.trim().length === 0}
          onClick={() => runImport.mutate()}
        >
          {t('Add to memory')}
        </Button>
      </DialogFooter>
    </>
  );
}

export function ImportMemoryDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl" overlayClassName="bg-black/20">
        <ImportMemoryContent
          key={open ? 'open' : 'closed'}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
