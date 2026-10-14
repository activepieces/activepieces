import { t } from 'i18next';
import { Square } from 'lucide-react';

import { LoadingSpinner } from '@/components/custom/spinner';
import { Button } from '@/components/ui/button';

import { useBuilderStateContext } from '../builder-hooks';

export function ChatCanvasStatus() {
  const chatActivity = useBuilderStateContext((state) => state.chatActivity);

  if (!chatActivity?.isWorking) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-20 z-40 flex justify-center">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border bg-gray-1 py-1 pl-4 pr-1 shadow-md animate-in fade-in slide-in-from-bottom-2">
        <LoadingSpinner className="size-4" />
        <span className="text-sm">{t('Chat is editing this flow…')}</span>
        <Button variant="ghost" size="sm" onClick={() => chatActivity.stop()}>
          <Square className="size-3" />
          {t('Stop')}
        </Button>
      </div>
    </div>
  );
}
