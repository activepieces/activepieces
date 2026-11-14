import {
  AgentConversationStatus,
  AppConnectionStatus,
  FlowApprovalRequestState,
  FlowRunStatus,
  InvitationStatus,
  McpActivityStatus,
  PieceSelectionMode,
  StepOutputStatus,
  UserStatus,
} from '@activepieces/shared';

import {
  CreditsSeverity,
  DomainVerificationStatus,
  HandlerFlowStatus,
  HealthCheckStatus,
  SaveBarStatus,
  SecretManagerStatus,
  SignInMethodStatus,
  StepNodeBadgeStatus,
  TestEventStatus,
  WorkerHealth,
} from './statuses';

export const statusColors = { of: colorsOf };

function colorsOf(status: Status): StatusColors {
  switch (status) {
    case FlowRunStatus.SUCCEEDED:
    case StepOutputStatus.SUCCEEDED:
    case StepOutputStatus.STOPPED:
    case AgentConversationStatus.IDLE:
    case AppConnectionStatus.ACTIVE:
    case FlowApprovalRequestState.APPROVED:
    case StepNodeBadgeStatus.TESTED:
    case McpActivityStatus.enum.SUCCEEDED:
    case UserStatus.ACTIVE:
    case InvitationStatus.ACCEPTED:
    case PieceSelectionMode.INCLUDE_ALL:
    case WorkerHealth.ONLINE:
    case HandlerFlowStatus.PUBLISHED:
    case TestEventStatus.SUCCEEDED:
    case HealthCheckStatus.PASSED:
    case SignInMethodStatus.CONNECTED:
    case DomainVerificationStatus.VERIFIED:
    case SecretManagerStatus.CONNECTED:
      return SUCCESS;
    case FlowRunStatus.FAILED:
    case FlowRunStatus.INTERNAL_ERROR:
    case FlowRunStatus.TIMEOUT:
    case FlowRunStatus.QUOTA_EXCEEDED:
    case FlowRunStatus.MEMORY_LIMIT_EXCEEDED:
    case FlowRunStatus.LOG_SIZE_EXCEEDED:
    case StepOutputStatus.FAILED:
    case AgentConversationStatus.ERROR:
    case AppConnectionStatus.ERROR:
    case FlowApprovalRequestState.REJECTED:
    case StepNodeBadgeStatus.FAILED:
    case CreditsSeverity.ERROR:
    case McpActivityStatus.enum.FAILED:
    case WorkerHealth.OFFLINE:
    case WorkerHealth.STUCK:
    case TestEventStatus.FAILED:
    case HealthCheckStatus.FAILED:
    case SecretManagerStatus.DISCONNECTED:
      return DANGER;
    case StepNodeBadgeStatus.INVALID:
    case CreditsSeverity.WARNING:
    case HandlerFlowStatus.DRAFT:
    case SignInMethodStatus.NOT_SET_UP:
    case DomainVerificationStatus.VERIFYING:
    case SaveBarStatus.UNSAVED:
    case InvitationStatus.PENDING:
      return WARNING;
    case SaveBarStatus.LOCKED:
    case StepNodeBadgeStatus.TESTING:
      return ACCENT;
    case FlowRunStatus.QUEUED:
    case FlowRunStatus.PAUSED:
    case FlowRunStatus.CANCELED:
    case StepOutputStatus.PAUSED:
    case AppConnectionStatus.MISSING:
    case FlowApprovalRequestState.PENDING:
    case UserStatus.INACTIVE:
    case PieceSelectionMode.EXCLUDE_ALL:
    case WorkerHealth.EMPTY:
    case HealthCheckStatus.LOADING:
    case HealthCheckStatus.NOT_APPLICABLE:
    case SecretManagerStatus.NOT_CONFIGURED:
      return NEUTRAL;
    case FlowRunStatus.RUNNING:
    case StepOutputStatus.RUNNING:
    case AgentConversationStatus.STREAMING:
      return RUNNING;
    case StepNodeBadgeStatus.NEEDS_TEST:
    case StepNodeBadgeStatus.UNTESTED:
    case StepNodeBadgeStatus.SKIPPED:
    case CreditsSeverity.DEFAULT:
      return PLAIN;
  }
}

const SUCCESS: StatusColors = {
  text: 'text-success-11',
  background: 'bg-success-3',
  border: 'border-success-7',
  dot: 'bg-success-10',
  solid: 'text-success-9',
};

const DANGER: StatusColors = {
  text: 'text-danger-11',
  background: 'bg-danger-3',
  border: 'border-danger-7',
  dot: 'bg-danger-10',
  solid: 'text-danger-9',
};

const WARNING: StatusColors = {
  text: 'text-warning-11',
  background: 'bg-warning-3',
  border: 'border-warning-7',
  dot: 'bg-warning-10',
  solid: 'text-warning-9',
};

const ACCENT: StatusColors = {
  text: 'text-accent-11',
  background: 'bg-accent-3',
  border: 'border-accent-7',
  dot: 'bg-accent-10',
  solid: 'text-accent-9',
};

const NEUTRAL: StatusColors = {
  text: 'text-gray-12',
  background: 'bg-gray-3',
  border: 'border-gray-7',
  dot: 'bg-gray-10',
  solid: 'text-gray-9',
};

const PLAIN: StatusColors = {
  text: 'text-gray-12',
  background: 'bg-gray-1',
  border: 'border-gray-6',
  dot: 'bg-gray-10',
  solid: 'text-gray-9',
};

const RUNNING: StatusColors = {
  text: 'text-gray-12',
  background: 'bg-gray-1',
  border: 'border-gray-6',
  dot: 'bg-accent-10',
  solid: 'text-accent-9',
};

export type Status =
  | FlowRunStatus
  | StepOutputStatus
  | AgentConversationStatus
  | AppConnectionStatus
  | FlowApprovalRequestState
  | StepNodeBadgeStatus
  | CreditsSeverity
  | McpActivityStatus
  | UserStatus
  | InvitationStatus
  | PieceSelectionMode
  | WorkerHealth
  | HandlerFlowStatus
  | TestEventStatus
  | HealthCheckStatus
  | SignInMethodStatus
  | DomainVerificationStatus
  | SecretManagerStatus
  | SaveBarStatus;

export type StatusColors = {
  text: string;
  background: string;
  border: string;
  dot: string;
  solid: string;
};
