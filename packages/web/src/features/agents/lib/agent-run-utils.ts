import {
  AgentConversation,
  AgentConversationStatus,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Check, CircleX, Loader, LucideIcon } from 'lucide-react';

function statusLook(status: AgentConversationStatus): AgentRunStatusLook {
  switch (status) {
    case AgentConversationStatus.STREAMING:
      return { icon: Loader, text: t('Running'), variant: 'default' };
    case AgentConversationStatus.ERROR:
      return { icon: CircleX, text: t('Failed'), variant: 'error' };
    case AgentConversationStatus.IDLE:
      return { icon: Check, text: t('Completed'), variant: 'success' };
  }
}

function durationMs(run: AgentConversation): number | undefined {
  const stillRunning = run.status === AgentConversationStatus.STREAMING;
  if (stillRunning) {
    return undefined;
  }
  return new Date(run.updated).getTime() - new Date(run.created).getTime();
}

export const agentRunUtils = { statusLook, durationMs };

export type AgentRunStatusLook = {
  icon: LucideIcon;
  text: string;
  variant: 'default' | 'error' | 'success';
};
