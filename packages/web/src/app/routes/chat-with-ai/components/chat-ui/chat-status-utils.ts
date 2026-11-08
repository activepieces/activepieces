import {
  ActionReceiptEvent,
  BatchProgressData,
  BuildPlanPhase,
  BuildPlanStepStatus,
  SubagentActivity,
} from '@activepieces/shared';

import { ToolStatus } from '@/features/chat/lib/chat-types';
import { ConversationIndicatorState } from '@/features/chat/lib/use-conversation-indicators';

function fromToolStatus(status: ToolStatus): ChatStatus {
  switch (status) {
    case 'running':
      return 'working';
    case 'completed':
      return 'done';
    case 'failed':
      return 'failed';
    case 'stopped':
      return 'stopped';
  }
}

function fromSubagent(status: SubagentActivity['status']): ChatStatus {
  switch (status) {
    case 'running':
      return 'working';
    case 'done':
      return 'done';
    case 'blocked':
      return 'needs-you';
    case 'failed':
      return 'stopped';
  }
}

function fromBuildStep(status: BuildPlanStepStatus): ChatStatus | null {
  switch (status) {
    case 'pending':
      return null;
    case 'in_progress':
      return 'working';
    case 'done':
      return 'done';
    case 'failed':
      return 'failed';
  }
}

function fromBuildPhase(phase: BuildPlanPhase): ChatStatus {
  switch (phase) {
    case 'detecting':
    case 'building':
    case 'testing':
      return 'working';
    case 'done':
      return 'done';
    case 'failed':
      return 'failed';
  }
}

function fromBatch({
  progress,
  ended = false,
}: {
  progress: Pick<BatchProgressData, 'done' | 'failed' | 'succeeded'>;
  ended?: boolean;
}): ChatStatus {
  if (!progress.done) return ended ? 'stopped' : 'working';
  return progress.failed > 0 && progress.succeeded === 0 ? 'failed' : 'done';
}

function fromReceipt(status: ActionReceiptEvent['status']): ChatStatus {
  return status === 'success' ? 'done' : 'failed';
}

function fromConversationIndicator(
  state: ConversationIndicatorState,
): ChatStatus | null {
  switch (state) {
    case 'working':
      return 'working';
    case 'waiting':
      return 'needs-you';
    case 'unread':
      return null;
  }
}

export const chatStatusUtils = {
  fromToolStatus,
  fromSubagent,
  fromBuildStep,
  fromBuildPhase,
  fromBatch,
  fromReceipt,
  fromConversationIndicator,
};

export type ChatStatus =
  | 'working'
  | 'needs-you'
  | 'done'
  | 'failed'
  | 'stopped';
