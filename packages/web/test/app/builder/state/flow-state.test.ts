// @vitest-environment jsdom
import {
  EmptyTrigger,
  FlowOperationRequest,
  FlowOperationStatus,
  FlowOperationType,
  FlowStatus,
  FlowTriggerType,
  FlowVersionState,
  PopulatedFlow,
} from '@activepieces/shared';
import { QueryClient } from '@tanstack/react-query';
import { AxiosError, AxiosHeaders } from 'axios';
import { toast } from 'sonner';
import { io } from 'socket.io-client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BuilderStore, createBuilderStore } from '@/app/builder/builder-hooks';

const flowsApiMock = vi.hoisted(() => ({
  update: vi.fn(),
  get: vi.fn(),
}));

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/features/flows/api/flows-api', () => ({
  flowsApi: flowsApiMock,
}));

describe('flow state save path', () => {
  beforeEach(() => {
    flowsApiMock.update.mockReset();
    flowsApiMock.get.mockReset();
    vi.spyOn(toast, 'error').mockReset();
  });

  it('saves the next edit after a failed save', async () => {
    flowsApiMock.update
      .mockRejectedValueOnce(new Error('Network Error'))
      .mockResolvedValue(draftFlow('Second name'));
    flowsApiMock.get.mockResolvedValue(draftFlow('Order lookup'));
    const store = createStore(draftFlow('Order lookup'));

    store.getState().applyOperation(changeName('First name'));
    await flushPromises();
    store.getState().applyOperation(changeName('Second name'));
    await flushPromises();

    expect(sentOperations()).toEqual([
      changeName('First name'),
      changeName('Second name'),
    ]);
  });

  it('sends the saves behind a failed save before it refetches the draft', async () => {
    flowsApiMock.update
      .mockRejectedValueOnce(new Error('Network Error'))
      .mockResolvedValue(draftFlow('Second name'));
    flowsApiMock.get.mockResolvedValue(draftFlow('Second name'));
    const store = createStore(draftFlow('Order lookup'));

    store.getState().applyOperation(changeName('First name'));
    store.getState().applyOperation(changeName('Second name'));
    await flushPromises();

    expect(sentOperations()).toEqual([
      changeName('First name'),
      changeName('Second name'),
    ]);
    const [, queuedSaveOrder] = flowsApiMock.update.mock.invocationCallOrder;
    const [refetchOrder] = flowsApiMock.get.mock.invocationCallOrder;
    expect(refetchOrder).toBeGreaterThan(queuedSaveOrder);
    expect(store.getState().flowVersion.displayName).toBe('Second name');
  });

  it('shows the message of a failed save', async () => {
    flowsApiMock.update.mockRejectedValue(
      serverError('Loop step parent step_9 not found'),
    );
    flowsApiMock.get.mockResolvedValue(draftFlow('Order lookup'));
    const store = createStore(draftFlow('Order lookup'));

    store.getState().applyOperation(changeName('First name'));
    await flushPromises();

    expect(toast.error).toHaveBeenCalledWith(
      'Your change was not saved',
      expect.objectContaining({
        description: 'Loop step parent step_9 not found',
      }),
    );
  });

  it('shows the draft on the server after a failed save', async () => {
    flowsApiMock.update.mockRejectedValue(new Error('Network Error'));
    flowsApiMock.get.mockResolvedValue(draftFlow('Name on the server'));
    const store = createStore(draftFlow('Order lookup'));

    store.getState().applyOperation(changeName('First name'));
    expect(store.getState().flowVersion.displayName).toBe('First name');
    await flushPromises();

    expect(store.getState().flowVersion.displayName).toBe('Name on the server');
  });

  it('clears the saving flag after a failed save', async () => {
    flowsApiMock.update.mockRejectedValue(new Error('Network Error'));
    flowsApiMock.get.mockResolvedValue(draftFlow('Order lookup'));
    const store = createStore(draftFlow('Order lookup'));

    store.getState().applyOperation(changeName('First name'));
    expect(store.getState().saving).toBe(true);
    await flushPromises();

    expect(store.getState().saving).toBe(false);
  });

  it('shows an error when the draft refetch after a failed save fails', async () => {
    flowsApiMock.update.mockRejectedValue(new Error('Network Error'));
    flowsApiMock.get.mockRejectedValue(new Error('Network Error'));
    const store = createStore(draftFlow('Order lookup'));

    store.getState().applyOperation(changeName('First name'));
    await flushPromises();

    expect(toast.error).toHaveBeenCalledWith(
      'Something went wrong',
      expect.anything(),
    );
  });
});

function serverError(message: string) {
  return new AxiosError(
    'Request failed with status code 400',
    AxiosError.ERR_BAD_REQUEST,
    undefined,
    undefined,
    {
      data: { code: 'FLOW_OPERATION_INVALID', params: { message } },
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: { headers: new AxiosHeaders() },
    },
  );
}

function changeName(displayName: string): FlowOperationRequest {
  return {
    type: FlowOperationType.CHANGE_NAME,
    request: { displayName },
  };
}

function sentOperations(): FlowOperationRequest[] {
  return flowsApiMock.update.mock.calls.map(([, operation]) => operation);
}

function createStore(flow: PopulatedFlow): BuilderStore {
  return createBuilderStore({
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
}

async function flushPromises() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

function draftFlow(displayName: string): PopulatedFlow {
  const trigger: EmptyTrigger = {
    name: 'trigger',
    valid: false,
    displayName: 'Select Trigger',
    type: FlowTriggerType.EMPTY,
    settings: {},
    lastUpdatedDate: '2026-01-01T00:00:00.000Z',
  };
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
      id: 'draft-1',
      created: '2026-01-01T00:00:00.000Z',
      updated: '2026-01-01T00:00:00.000Z',
      flowId: 'flow-1',
      displayName,
      trigger,
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
