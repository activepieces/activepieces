import { Check, Play, X } from 'lucide-react';

import { AgentTaskStatus } from '@activepieces/shared';

export const agentRunUtils = {
  getStatusIcon(status: AgentTaskStatus): {
    variant: 'default' | 'success' | 'error';
    Icon: typeof Play | typeof Check | typeof X;
  } {
    switch (status) {
      case AgentTaskStatus.IN_PROGRESS:
        return {
          variant: 'default',
          Icon: Play,
        };
      case AgentTaskStatus.COMPLETED:
        return {
          variant: 'success',
          Icon: Check,
        };
      case AgentTaskStatus.FAILED:
        return {
          variant: 'error',
          Icon: X,
        };
    }
  },
};
