import { t } from 'i18next';
import { ChevronRight } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

import { ImportMemoryDialog } from './import-memory-dialog';
import { ManageMemoriesDialog } from './manage-memories-dialog';
import { useChatMemory } from './use-chat-memory';

export function MemorySection() {
  const { data } = useChatMemory();
  const [manageOpen, setManageOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  return (
    <div className="space-y-6">
      <h2 className="text-base font-semibold tracking-tight">{t('Memory')}</h2>

      <div className="space-y-5">
        <button
          type="button"
          onClick={() => setManageOpen(true)}
          className="flex w-full items-center justify-between gap-2 rounded-lg bg-muted/40 px-4 py-3.5 text-left transition-colors hover:bg-muted/70"
        >
          <span className="text-sm">
            <span className="font-medium">{t('View and manage memory')}</span>
            <span className="text-muted-foreground">
              {' · '}
              {t('memoryCount', { count: data?.memories.length ?? 0 })}
            </span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>

        <div className="flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <p className="text-sm">{t('Import memory from another AI')}</p>
            <p className="text-sm text-muted-foreground">
              {t(
                'Bring your context and facts from another AI assistant. We give you a prompt to fetch them.',
              )}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => setImportOpen(true)}
          >
            {t('Start import')}
          </Button>
        </div>
      </div>

      <ManageMemoriesDialog open={manageOpen} onOpenChange={setManageOpen} />
      <ImportMemoryDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}
