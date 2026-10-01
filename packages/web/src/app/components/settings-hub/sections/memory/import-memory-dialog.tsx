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
import { cn } from '@/lib/utils';

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
        <span className="flex size-6 items-center justify-center rounded-full bg-gray-3 text-xs font-medium text-gray-11">
          {number}
        </span>
        {!last && <span className="mt-1 w-px flex-1 bg-gray-6" />}
      </div>
      <div className={cn('flex flex-1 flex-col gap-2', !last && 'pb-6')}>
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
        <DialogTitle>{t('Import memory')}</DialogTitle>
      </DialogHeader>

      <div className="flex flex-col">
        <Step
          number={1}
          title={t('Copy this prompt into a chat with your other AI provider')}
        >
          <div className="relative rounded-xl border bg-gray-2 p-3">
            <p className="max-h-28 overflow-hidden whitespace-pre-wrap pr-12 text-sm text-gray-11 [mask-image:linear-gradient(to_bottom,black_55%,transparent)]">
              {EXPORT_PROMPT}
            </p>
            <CopyButton
              textToCopy={EXPORT_PROMPT}
              variant="outline"
              className="absolute top-2 right-2"
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
      <DialogContent size="lg" overlayClassName="bg-scrim/40">
        <ImportMemoryContent
          key={open ? 'open' : 'closed'}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
