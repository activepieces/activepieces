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
