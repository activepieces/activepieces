function ofGroup({
  online,
  inUse,
}: {
  online: number;
  inUse: boolean;
}): WorkerHealth {
  if (online > 0) {
    return WorkerHealth.ONLINE;
  }
  return inUse ? WorkerHealth.OFFLINE : WorkerHealth.EMPTY;
}

export const workerHealthUtils = { ofGroup };

export enum CreditsSeverity {
  DEFAULT = 'DEFAULT',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
}

export enum StepNodeBadgeStatus {
  INVALID = 'INVALID',
  TESTING = 'TESTING',
  FAILED = 'FAILED',
  NEEDS_TEST = 'NEEDS_TEST',
  UNTESTED = 'UNTESTED',
  TESTED = 'TESTED',
  SKIPPED = 'SKIPPED',
}

export enum MemberStatus {
  INVITED = 'INVITED',
}

export enum SaveBarStatus {
  LOCKED = 'LOCKED',
  UNSAVED = 'UNSAVED',
}

export enum HandlerFlowStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
}

export enum TestEventStatus {
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
}

export enum HealthCheckStatus {
  LOADING = 'LOADING',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  NOT_APPLICABLE = 'NOT_APPLICABLE',
  UNKNOWN = 'UNKNOWN',
}

export enum WorkerHealth {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  EMPTY = 'EMPTY',
  STUCK = 'STUCK',
}

export enum SecretManagerStatus {
  NOT_CONFIGURED = 'NOT_CONFIGURED',
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
}

export enum SignInMethodStatus {
  CONNECTED = 'CONNECTED',
  NOT_SET_UP = 'NOT_SET_UP',
}

export enum DomainVerificationStatus {
  VERIFIED = 'VERIFIED',
  VERIFYING = 'VERIFYING',
}

export enum BatchChildStatus {
  PENDING = 'PENDING',
  FAILED_TO_START = 'FAILED_TO_START',
  STILL_RUNNING = 'STILL_RUNNING',
  NEVER_STARTED = 'NEVER_STARTED',
  DID_NOT_RUN = 'DID_NOT_RUN',
  LOGS_UNAVAILABLE = 'LOGS_UNAVAILABLE',
}
