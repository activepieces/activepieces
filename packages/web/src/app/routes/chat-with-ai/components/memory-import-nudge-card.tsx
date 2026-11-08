import { TelemetryEventName } from '@activepieces/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { Brain } from 'lucide-react';
import { useEffect, useState } from 'react';

import { ImportMemoryDialog } from '@/app/components/settings-hub/sections/memory/import-memory-dialog';
import { useTelemetry } from '@/components/providers/telemetry-provider';
import { Button } from '@/components/ui/button';
import { chatApi } from '@/features/chat/lib/chat-api';

import {
  ChatCard,
  ChatCardActions,
  ChatCardBody,
  ChatCardHeader,
  ChatCardTile,
} from './chat-ui/chat-card';

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
    <ChatCard className="mt-2">
      <ChatCardHeader
        tile={<ChatCardTile kind="bits" icon={Brain} />}
        title={t('Chat works better when it knows you')}
      />
      <ChatCardBody>
        <p className="text-sm text-gray-11">
          {t(
            'Bring what ChatGPT or Claude already know about you, so chat starts from there.',
          )}
        </p>
      </ChatCardBody>
      <ChatCardActions>
        <Button size="sm" onClick={openImport}>
          {t('Bring my memory')}
        </Button>
        <Button size="sm" variant="ghost" onClick={hide}>
          {t('Not now')}
        </Button>
      </ChatCardActions>
      <ImportMemoryDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={onImported}
      />
    </ChatCard>
  );
}

const MEMORY_IMPORT_NUDGE_QUERY_KEY = ['memory-import-nudge'];
