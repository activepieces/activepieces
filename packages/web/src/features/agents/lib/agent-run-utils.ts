import { AgentConversationStatus } from '@activepieces/shared';
import { t } from 'i18next';
import { CircleAlert, CircleCheck, LucideIcon, Play } from 'lucide-react';

function getStatusIcon(status: AgentConversationStatus): AgentRunStatusIcon {
  switch (status) {
    case AgentConversationStatus.STREAMING:
      return { Icon: Play, variant: 'default' };
    case AgentConversationStatus.ERROR:
      return { Icon: CircleAlert, variant: 'error' };
    case AgentConversationStatus.IDLE:
      return { Icon: CircleCheck, variant: 'default' };
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

export const agentRunUtils = {
  getStatusIcon,
  getStatusLabel,
};

export type AgentRunStatusIcon = {
  Icon: LucideIcon;
  variant: 'default' | 'error' | 'success';
};
