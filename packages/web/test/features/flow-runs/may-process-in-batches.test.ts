import {
  CodeAction,
  EmptyTrigger,
  FlowAction,
  FlowActionType,
  FlowTriggerType,
  FlowVersion,
  FlowVersionState,
  ProcessInBatchesAction,
} from '@activepieces/shared';
import { describe, expect, it } from 'vitest';

import { flowRunUtils } from '@/features/flow-runs/utils/flow-run-utils';

const createCodeAction = (name: string): CodeAction => ({
  name,
  valid: true,
  displayName: name,
  lastUpdatedDate: '2026-01-01T00:00:00.000Z',
  type: FlowActionType.CODE,
  settings: {
    sourceCode: {
      code: 'export const code = async () => true;',
      packageJson: '{}',
    },
    input: {},
    errorHandlingOptions: {},
  },
});

const createBatchAction = (name: string): ProcessInBatchesAction => ({
  name,
  valid: true,
  displayName: name,
  lastUpdatedDate: '2026-01-01T00:00:00.000Z',
  type: FlowActionType.PROCESS_IN_BATCHES,
  settings: {
    items: '{{ trigger.rows }}',
    batchSize: 10,
    errorHandlingOptions: {},
  },
});

const createFlowVersion = (firstAction?: FlowAction): FlowVersion => {
  const trigger: EmptyTrigger = {
    name: 'trigger',
    valid: false,
    displayName: 'Select Trigger',
    type: FlowTriggerType.EMPTY,
    settings: {},
    lastUpdatedDate: '2026-01-01T00:00:00.000Z',
    nextAction: firstAction,
  };
  return {
    id: 'version-id',
    created: '2026-01-01T00:00:00.000Z',
    updated: '2026-01-01T00:00:00.000Z',
    flowId: 'flow-id',
    displayName: 'Test flow',
    trigger,
    updatedBy: null,
    valid: false,
    schemaVersion: null,
    agentIds: [],
    state: FlowVersionState.LOCKED,
    connectionIds: [],
    backupFiles: null,
    notes: [],
  };
};

const batchVersion = createFlowVersion(createBatchAction('batch_step'));
const plainVersion = createFlowVersion(createCodeAction('step_1'));

describe('flowRunUtils.mayProcessInBatches', () => {
  it('warns when a resolved version contains a batch step', () => {
    expect(
      flowRunUtils.mayProcessInBatches({
        versions: [batchVersion],
        hasUnknownRuns: false,
      }),
    ).toBe(true);
  });

  it('stays quiet when every resolved version has no batch step', () => {
    expect(
      flowRunUtils.mayProcessInBatches({
        versions: [plainVersion, plainVersion],
        hasUnknownRuns: false,
      }),
    ).toBe(false);
  });

  it('warns when any version in a mixed selection has a batch step', () => {
    expect(
      flowRunUtils.mayProcessInBatches({
        versions: [plainVersion, batchVersion],
        hasUnknownRuns: false,
      }),
    ).toBe(true);
  });

  it('warns while a version is still unresolved', () => {
    expect(
      flowRunUtils.mayProcessInBatches({
        versions: [plainVersion, undefined],
        hasUnknownRuns: false,
      }),
    ).toBe(true);
  });

  it('warns when the selection holds runs it cannot see', () => {
    expect(
      flowRunUtils.mayProcessInBatches({
        versions: [plainVersion],
        hasUnknownRuns: true,
      }),
    ).toBe(true);
  });

  it('stays quiet when nothing is selected', () => {
    expect(
      flowRunUtils.mayProcessInBatches({
        versions: [],
        hasUnknownRuns: false,
      }),
    ).toBe(false);
  });
});
