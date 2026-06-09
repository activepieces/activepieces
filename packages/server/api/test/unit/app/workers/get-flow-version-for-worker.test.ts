import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FastifyBaseLogger } from 'fastify';
import {
  FlowActionType,
  FlowTriggerType,
  FlowVersionState,
} from '@activepieces/shared';
import type { FlowVersion } from '@activepieces/shared';

const mockGetFlowVersion = vi.fn();
const mockGetFlow = vi.fn();
const mockMigrate = vi.fn();

vi.mock('../../../../src/app/flows/flow-version/flow-version.service', () => ({
  flowVersionService: vi.fn(() => ({
    getOne: mockGetFlowVersion,
  })),
}));

vi.mock('../../../../src/app/flows/flow/flow.service', () => ({
  flowService: vi.fn(() => ({
    getOneById: mockGetFlow,
  })),
}));

vi.mock(
  '../../../../src/app/flows/flow-version/flow-version-migration.service',
  () => ({
    flowVersionMigrationService: vi.fn(() => ({
      migrate: mockMigrate,
    })),
  })
);

import { getFlowVersionForWorker } from '../../../../src/app/workers/rpc/get-flow-version-for-worker';

const mockLog = {
  info: vi.fn(),
  debug: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  child: vi.fn(),
  fatal: vi.fn(),
  trace: vi.fn(),
  silent: vi.fn(),
  level: 'info',
} as unknown as FastifyBaseLogger;

function makeFlowVersion(overrides: Partial<FlowVersion> = {}): FlowVersion {
  return {
    id: overrides.id ?? 'fv-1',
    created: '2024-01-01T00:00:00Z',
    updated: '2024-01-01T00:00:00Z',
    flowId: overrides.flowId ?? 'flow-1',
    displayName: overrides.displayName ?? 'Test Flow',
    trigger: overrides.trigger ?? {
      type: FlowTriggerType.PIECE,
      name: 'trigger',
      displayName: 'Trigger',
      valid: true,
      lastUpdatedDate: '2024-01-01T00:00:00Z',
      settings: {
        pieceName: '@activepieces/piece-webhook',
        pieceVersion: '0.0.1',
        triggerName: 'catch_webhook',
        input: {},
        propertySettings: {},
      },
      nextAction: {
        type: FlowActionType.PIECE,
        name: 'step_1',
        displayName: 'Step 1',
        valid: true,
        lastUpdatedDate: '2024-01-01T00:00:00Z',
        settings: {
          pieceName: '@activepieces/piece-test',
          pieceVersion: '0.0.1',
          actionName: 'do',
          input: { field: '{{step_1.foo}}' },
          propertySettings: {},
        },
      },
    },
    updatedBy: null,
    valid: true,
    schemaVersion: overrides.schemaVersion ?? '21',
    agentIds: [],
    state: FlowVersionState.LOCKED,
    connectionIds: [],
    backupFiles: null,
    notes: [],
  };
}

describe('getFlowVersionForWorker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when the flow version is missing', async () => {
    mockGetFlowVersion.mockResolvedValue(null);

    const result = await getFlowVersionForWorker({
      log: mockLog,
      versionId: 'fv-1',
    });

    expect(result).toBeNull();
    expect(mockGetFlow).not.toHaveBeenCalled();
    expect(mockMigrate).not.toHaveBeenCalled();
  });

  it('returns null when the parent flow is missing', async () => {
    const flowVersion = makeFlowVersion();
    mockGetFlowVersion.mockResolvedValue(flowVersion);
    mockGetFlow.mockResolvedValue(null);

    const result = await getFlowVersionForWorker({
      log: mockLog,
      versionId: flowVersion.id,
    });

    expect(result).toBeNull();
    expect(mockMigrate).not.toHaveBeenCalled();
  });

  it('returns the migrated flow version for workers', async () => {
    const oldVersion = makeFlowVersion();
    const migratedVersion = { ...oldVersion, schemaVersion: '22' };
    mockGetFlowVersion.mockResolvedValue(oldVersion);
    mockGetFlow.mockResolvedValue({
      id: oldVersion.flowId,
      projectId: 'project-1',
    });
    mockMigrate.mockResolvedValue(migratedVersion);

    const result = await getFlowVersionForWorker({
      log: mockLog,
      versionId: oldVersion.id,
    });

    expect(mockMigrate).toHaveBeenCalledWith(oldVersion, 'project-1');
    expect(result).toEqual(migratedVersion);
  });
});
