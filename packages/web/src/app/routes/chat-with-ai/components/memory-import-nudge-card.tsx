import { TelemetryEventName } from '@activepieces/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { Brain } from 'lucide-react';
import { useEffect, useState } from 'react';

import { ImportMemoryDialog } from '@/app/components/settings-hub/sections/memory/import-memory-dialog';
import { useTelemetry } from '@/components/providers/telemetry-provider';
import { Button } from '@/components/ui/button';
import { chatApi } from '@/features/chat/lib/chat-api';

import { ChatCard } from './chat-card-primitives';

export function MemoryImportNudgeCard({
  conversationId,
}: {
  conversationId: string;
}) {
  const queryClient = useQueryClient();
  const { capture } = useTelemetry();
  const [importOpen, setImportOpen] = useState(false);
  const { data } = useQuery({
    queryKey: MEMORY_IMPORT_NUDGE_QUERY_KEY,
    queryFn: chatApi.getMemoryImportNudge,
    staleTime: Infinity,
  });
  const [visible, setVisible] = useState(false);
  const { mutate: claim } = useMutation({
    mutationFn: chatApi.claimMemoryImportNudge,
    onError: () =>
      queryClient.invalidateQueries({
        queryKey: MEMORY_IMPORT_NUDGE_QUERY_KEY,
        refetchType: 'none',
      }),
  });
  const eligible = data?.eligible === true;

  useEffect(() => {
    if (!eligible) return;
    queryClient.setQueryData(MEMORY_IMPORT_NUDGE_QUERY_KEY, {
      eligible: false,
    });
    claim(undefined, {
      onSuccess: ({ claimed }) => {
        if (!claimed) return;
        setVisible(true);
        capture({
          name: TelemetryEventName.MEMORY_IMPORT_NUDGE_SHOWN,
          payload: { conversationId },
        });
      },
    });
  }, [eligible, queryClient, claim, capture, conversationId]);

  if (!visible) {
    return null;
  }

  const hide = () => setVisible(false);

  const openImport = () => {
    capture({
      name: TelemetryEventName.MEMORY_IMPORT_NUDGE_CLICKED,
      payload: { conversationId },
    });
    setImportOpen(true);
  };

  const onImported = () => {
    capture({
      name: TelemetryEventName.MEMORY_IMPORT_NUDGE_IMPORTED,
      payload: { conversationId },
    });
    hide();
  };

  return (
    <ChatCard className="mt-2 shadow-none">
      <div className="flex items-start gap-3">
        <Brain className="size-5 shrink-0 text-accent-11" />
        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-sm font-medium">
            {t('Chat works better when it knows you')}
          </p>
          <p className="text-sm text-gray-11">
            {t(
              'Bring what ChatGPT or Claude already know about you, so chat starts from there.',
            )}
          </p>
          <div className="flex items-center gap-2 pt-2">
            <Button size="sm" onClick={openImport}>
              {t('Bring my memory')}
            </Button>
            <Button size="sm" variant="ghost" onClick={hide}>
              {t('Not now')}
            </Button>
          </div>
        </div>
      </div>
      <ImportMemoryDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={onImported}
      />
    </ChatCard>
  );
}

const MEMORY_IMPORT_NUDGE_QUERY_KEY = ['memory-import-nudge'];
