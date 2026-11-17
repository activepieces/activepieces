import {
  AgentConversationStatus,
  AgentRunListItem,
} from '@activepieces/shared';
import { t } from 'i18next';
import { CircleAlert, CircleCheck, LucideIcon, Play } from 'lucide-react';

function getStatusIcon(status: AgentConversationStatus): LucideIcon {
  switch (status) {
    case AgentConversationStatus.STREAMING:
      return Play;
    case AgentConversationStatus.ERROR:
      return CircleAlert;
    case AgentConversationStatus.IDLE:
      return CircleCheck;
  }
}

function getStatusLabel(status: AgentConversationStatus): string {
  switch (status) {
    case AgentConversationStatus.STREAMING:
      return t('Running');
    case AgentConversationStatus.ERROR:
      return t('Failed');
    case AgentConversationStatus.IDLE:
      return t('Done');
  }
}

function getDurationMs(run: AgentRunListItem): number | undefined {
  const stillRunning = run.status === AgentConversationStatus.STREAMING;
  if (stillRunning) {
    return undefined;
  }
  return new Date(run.updated).getTime() - new Date(run.created).getTime();
}

export const agentRunUtils = {
  getStatusIcon,
  getStatusLabel,
  getDurationMs,
};
