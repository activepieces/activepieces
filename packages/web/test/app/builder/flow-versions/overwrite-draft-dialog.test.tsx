// @vitest-environment jsdom
import {
  FlowOperationStatus,
  FlowStatus,
  FlowTriggerType,
  FlowVersionState,
  PopulatedFlow,
} from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { io } from 'socket.io-client';
import { describe, expect, it, vi } from 'vitest';

const flowsApiMock = vi.hoisted(() => ({ update: vi.fn(), get: vi.fn() }));

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/features/flows/api/flows-api', () => ({
  flowsApi: flowsApiMock,
}));

vi.mock('@/hooks/authorization-hooks', () => ({
  useAuthorization: () => ({ checkAccess: () => true }),
}));

import {
  BuilderStateContext,
  createBuilderStore,
} from '@/app/builder/builder-hooks';
import { OverwriteDraftDialog } from '@/app/builder/flow-versions/overwrite-draft-dialog';

describe('OverwriteDraftDialog', () => {
  it('stays open and busy while the pending edits save, and closes after the overwrite', async () => {
    const flow = draftFlow();
    const store = createBuilderStore({
      flow,
      flowVersion: flow.version,
      readonly: false,
      hideTestWidget: false,
      run: null,
      outputSampleData: {},
      inputSampleData: {},
      socket: io({ autoConnect: false }),
      queryClient: new QueryClient(),
    });
    const pendingEdits = Promise.withResolvers<void>();
    store.setState({ savePendingEdits: () => pendingEdits.promise });
    flowsApiMock.update.mockResolvedValue(flow);
    const onConfirm = vi.fn();
    render(
      <QueryClientProvider client={new QueryClient()}>
        <BuilderStateContext.Provider value={store}>
          <OverwriteDraftDialog
            versionId="version-0"
            versionNumber="1"
            onConfirm={onConfirm}
          >
            <span>Use as Draft</span>
          </OverwriteDraftDialog>
        </BuilderStateContext.Provider>
      </QueryClientProvider>,
    );
    fireEvent.click(screen.getByText('Use as Draft'));
    const overwrite = screen.getByRole('button', { name: 'Overwrite' });

    fireEvent.click(overwrite);

    await waitFor(() => {
      expect(overwrite.hasAttribute('disabled')).toBe(true);
    });
    expect(screen.getByText('Overwrite Draft')).toBeTruthy();
    expect(flowsApiMock.update).not.toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();

    pendingEdits.resolve();

    await waitFor(() => {
      expect(screen.queryByText('Overwrite Draft')).toBeNull();
    });
    expect(flowsApiMock.update).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});

function draftFlow(): PopulatedFlow {
  return {
    id: 'flow-1',
    created: '2026-01-01T00:00:00.000Z',
    updated: '2026-01-01T00:00:00.000Z',
    projectId: 'project-1',
    externalId: 'flow-1',
    ownerId: null,
    folderId: null,
    status: FlowStatus.DISABLED,
    publishedVersionId: null,
    metadata: null,
    operationStatus: FlowOperationStatus.NONE,
    timeSavedPerRun: null,
    templateId: null,
    createdBy: null,
    version: {
      id: 'version-1',
      created: '2026-01-01T00:00:00.000Z',
      updated: '2026-01-01T00:00:00.000Z',
      flowId: 'flow-1',
      displayName: 'Order lookup',
      trigger: {
        name: 'trigger',
        valid: false,
        displayName: 'Select Trigger',
        type: FlowTriggerType.EMPTY,
        settings: {},
        lastUpdatedDate: '2026-01-01T00:00:00.000Z',
      },
      updatedBy: null,
      valid: false,
      schemaVersion: null,
      agentIds: [],
      state: FlowVersionState.DRAFT,
      connectionIds: [],
      backupFiles: null,
      notes: [],
    },
  };
}
