import { t } from 'i18next';
import { Bot } from 'lucide-react';

import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

export function AgentPanelFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-[380px] rounded-lg border bg-card flex flex-col">
      <div className="flex items-center gap-2 p-3">
        <div className="flex size-8 items-center justify-center rounded-md bg-muted shrink-0">
          <Bot className="size-4 text-muted-foreground" />
        </div>
        <div className="flex flex-col">
          <p className="text-sm font-medium leading-none">{t('Agent')}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('Summarize support tickets')}
          </p>
        </div>
      </div>
      <Separator />
      <div className="flex flex-col gap-4 p-3">
        <div className="flex flex-col gap-2">
          <Label>{t('Prompt')}</Label>
          <Textarea
            disabled
            rows={3}
            value={t(
              'Read the new support tickets and summarize the top recurring issues.',
            )}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>{t('AI Model')}</Label>
          {children}
        </div>
      </div>
    </div>
  );
}
