import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';

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
import { describe, expect, it } from 'vitest';

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
} from '@/lib/statuses';

const STATUS_ENUMS: Record<string, readonly string[]> = {
  FlowRunStatus: Object.values(FlowRunStatus),
  StepOutputStatus: Object.values(StepOutputStatus),
  AgentConversationStatus: Object.values(AgentConversationStatus),
  AppConnectionStatus: Object.values(AppConnectionStatus),
  FlowApprovalRequestState: Object.values(FlowApprovalRequestState),
  InvitationStatus: Object.values(InvitationStatus),
  McpActivityStatus: McpActivityStatus.options,
  PieceSelectionMode: Object.values(PieceSelectionMode),
  UserStatus: Object.values(UserStatus),
  CreditsSeverity: Object.values(CreditsSeverity),
  DomainVerificationStatus: Object.values(DomainVerificationStatus),
  HandlerFlowStatus: Object.values(HandlerFlowStatus),
  HealthCheckStatus: Object.values(HealthCheckStatus),
  SaveBarStatus: Object.values(SaveBarStatus),
  SecretManagerStatus: Object.values(SecretManagerStatus),
  SignInMethodStatus: Object.values(SignInMethodStatus),
  StepNodeBadgeStatus: Object.values(StepNodeBadgeStatus),
  TestEventStatus: Object.values(TestEventStatus),
  WorkerHealth: Object.values(WorkerHealth),
};

const SHARED_WORDS = [
  'SUCCEEDED',
  'FAILED',
  'RUNNING',
  'PAUSED',
  'ERROR',
  'ACTIVE',
  'PENDING',
  'CONNECTED',
];

const SRC = join(__dirname, '../../src');
const MAPPING_FILES = [
  'lib/status-colors.ts',
  'features/flow-runs/hooks/flow-run-hooks.ts',
  'app/routes/platform/infra/health/components/status-line-chart.tsx',
];
const NEARBY_LINES = 6;
const STATUS_COLOR_CLASS =
  /\b(?:text|bg|border)-(?:success|danger|warning|accent)-\d+/;

describe('status colours', () => {
  it('gives a word shared by two status enums the same meaning on purpose', () => {
    const owners = new Map<string, string[]>();
    for (const [name, values] of Object.entries(STATUS_ENUMS)) {
      for (const value of values) {
        owners.set(value, [...(owners.get(value) ?? []), name]);
      }
    }
    const unexpected = [...owners.entries()]
      .filter(
        ([value, names]) => names.length > 1 && !SHARED_WORDS.includes(value)
      )
      .map(([value, names]) => `${value}: ${names.join(', ')}`);
    expect(unexpected).toEqual([]);
  });

  it('maps a status to colour classes only in the shared file and the chart files', () => {
    const enumNames = Object.keys(STATUS_ENUMS).join('|');
    const statusSwitch = new RegExp(
      `case (?:${enumNames})\\.|Record<\\s*(?:${enumNames})\\b`
    );
    const offenders = listSourceFiles(SRC)
      .map((path) => relative(SRC, path))
      .filter((path) => !MAPPING_FILES.includes(path))
      .filter((path) => {
        const lines = readFileSync(join(SRC, path), 'utf8').split('\n');
        return lines.some(
          (line, index) =>
            statusSwitch.test(line) &&
            lines
              .slice(index, index + NEARBY_LINES)
              .some((nearby) => STATUS_COLOR_CLASS.test(nearby))
        );
      });
    expect(offenders).toEqual([]);
  });
});

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      return listSourceFiles(path);
    }
    return /\.tsx?$/.test(entry) ? [path] : [];
  });
}
