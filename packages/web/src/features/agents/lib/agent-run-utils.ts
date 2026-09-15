import {
  AgentConversation,
  AgentConversationStatus,
} from '@activepieces/shared';
import { t } from 'i18next';
import { CircleAlert, CircleCheck, LucideIcon, Play } from 'lucide-react';

function getStatusIcon(status: AgentConversationStatus): AgentRunStatusIcon {
  switch (status) {
    case AgentConversationStatus.STREAMING:
      return { Icon: Play, variant: 'default' };
    case AgentConversationStatus.ERROR:
      return { Icon: CircleAlert, variant: 'error' };
    case AgentConversationStatus.IDLE:
      return { Icon: CircleCheck, variant: 'success' };
  }
}

function getStatusLabel(status: AgentConversationStatus): string {
  switch (status) {
    case AgentConversationStatus.STREAMING:
      return t('Running');
    case AgentConversationStatus.ERROR:
      return t('Failed');
    case AgentConversationStatus.IDLE:
      return t('Completed');
  }
}

function getDurationMs(run: AgentConversation): number | undefined {
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

export type AgentRunStatusIcon = {
  Icon: LucideIcon;
  variant: 'default' | 'error' | 'success';
};
