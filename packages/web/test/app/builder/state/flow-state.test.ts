// @vitest-environment jsdom
import {
  EmptyTrigger,
  FlowOperationRequest,
  FlowOperationStatus,
  FlowOperationType,
  FlowStatus,
  FlowTriggerType,
  FlowVersionState,
  NoteColorVariant,
  PopulatedFlow,
  SampleDataFileType,
  flowOperations,
} from '@activepieces/shared';
import { QueryClient } from '@tanstack/react-query';
import { AxiosError, AxiosHeaders } from 'axios';
import { toast } from 'sonner';
import { io } from 'socket.io-client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
      .mockRejectedValueOnce(httpError({ status: 400 }))
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
      .mockRejectedValueOnce(httpError({ status: 400 }))
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
    flowsApiMock.update.mockRejectedValue(httpError({ status: 400 }));
    flowsApiMock.get.mockResolvedValue(draftFlow('Name on the server'));
    const store = createStore(draftFlow('Order lookup'));

    store.getState().applyOperation(changeName('First name'));
    expect(store.getState().flowVersion.displayName).toBe('First name');
    await flushPromises();

    expect(store.getState().flowVersion.displayName).toBe('Name on the server');
  });

  it('clears the saving flag after a failed save', async () => {
    flowsApiMock.update.mockRejectedValue(httpError({ status: 400 }));
    flowsApiMock.get.mockResolvedValue(draftFlow('Order lookup'));
    const store = createStore(draftFlow('Order lookup'));

    store.getState().applyOperation(changeName('First name'));
    expect(store.getState().saving).toBe(true);
    await flushPromises();

    expect(store.getState().saving).toBe(false);
  });

  it('shows an error when the draft refetch after a failed save fails', async () => {
    flowsApiMock.update.mockRejectedValue(httpError({ status: 400 }));
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

describe('flow state step edits', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    flowsApiMock.update.mockReset();
    flowsApiMock.update.mockResolvedValue(draftFlow('Order lookup'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('saves a long typing burst in one step at least every 5 s', async () => {
    const store = createStore(draftFlow('Order lookup'));

    for (let elapsed = 0; elapsed < 12_000; elapsed += 200) {
      store.getState().applyOperation(renameTrigger(`New order ${elapsed}`));
      await vi.advanceTimersByTimeAsync(200);
    }

    expect(flowsApiMock.update.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('saves an edit 1 s after it when no keystroke follows', async () => {
    const store = createStore(draftFlow('Order lookup'));

    store.getState().applyOperation(renameTrigger('New order'));
    await vi.advanceTimersByTimeAsync(999);
    expect(sentOperations()).toEqual([]);

    await vi.advanceTimersByTimeAsync(1);
    expect(sentOperations()).toEqual([renameTrigger('New order')]);
  });
});

describe('flow state pending edits', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    flowsApiMock.update.mockReset();
    flowsApiMock.update.mockResolvedValue(draftFlow('Order lookup'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sends an edit inside the debounce at once', async () => {
    const store = createStore(draftFlow('Order lookup'));

    store.getState().applyOperation(renameTrigger('New order'));
    await store.getState().savePendingEdits();

    expect(sentOperations()).toEqual([renameTrigger('New order')]);
  });

  it('settles only after the save of the edit ends', async () => {
    const save = Promise.withResolvers<PopulatedFlow>();
    flowsApiMock.update.mockReturnValue(save.promise);
    const store = createStore(draftFlow('Order lookup'));
    const settled = vi.fn();

    store.getState().applyOperation(renameTrigger('New order'));
    const savingEdits = store.getState().savePendingEdits().then(settled);
    await vi.advanceTimersByTimeAsync(0);
    expect(settled).not.toHaveBeenCalled();

    save.resolve(draftFlow('Order lookup'));
    await savingEdits;
    expect(settled).toHaveBeenCalled();
  });

  it('fails when the save of the edit fails, and shows the failed-save message', async () => {
    const failure = httpError({ status: 400 });
    flowsApiMock.update.mockRejectedValue(failure);
    flowsApiMock.get.mockResolvedValue(draftFlow('Order lookup'));
    vi.spyOn(toast, 'error').mockReset();
    const store = createStore(draftFlow('Order lookup'));

    store.getState().applyOperation(renameTrigger('New order'));

    await expect(store.getState().savePendingEdits()).rejects.toBe(failure);
    expect(toast.error).toHaveBeenCalledWith(
      'Your change was not saved',
      expect.anything(),
    );
  });

  it('sends an edit inside the debounce at once on a flush', async () => {
    const store = createStore(draftFlow('Order lookup'));

    store.getState().applyOperation(renameTrigger('New order'));
    store.getState().flushPendingEdits();
    await vi.advanceTimersByTimeAsync(0);

    expect(sentOperations()).toEqual([renameTrigger('New order')]);
  });
});

describe('flow state note edits', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    flowsApiMock.update.mockReset();
    flowsApiMock.update.mockResolvedValue(draftFlow('Order lookup'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('saves a new note when an edit of it follows within 1 s', async () => {
    const store = createStore(draftFlow('Order lookup'));

    store.getState().applyOperation(addNote());
    await vi.advanceTimersByTimeAsync(300);
    store.getState().applyOperation(updateNote('Call the customer'));
    await vi.advanceTimersByTimeAsync(1000);

    expect(sentOperations()).toEqual([
      addNote(),
      updateNote('Call the customer'),
    ]);
  });
});

describe('flow state save retries', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    flowsApiMock.update.mockReset();
    flowsApiMock.get.mockReset();
    flowsApiMock.get.mockResolvedValue(draftFlow('Name on the server'));
    vi.spyOn(toast, 'error').mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('retries a save with no response after 1 s, 2 s and 4 s', async () => {
    const start = Date.now();
    const attemptTimes: number[] = [];
    flowsApiMock.update.mockImplementation(async () => {
      attemptTimes.push(Date.now() - start);
      throw networkError();
    });
    const store = createStore(draftFlow('Order lookup'));

    store.getState().applyOperation(changeName('First name'));
    await vi.advanceTimersByTimeAsync(10_000);

    expect(attemptTimes).toEqual([0, 1000, 3000, 7000]);
  });

  it.each([408, 429, 500, 503])(
    'retries a save with a %i status',
    async (status) => {
      flowsApiMock.update.mockRejectedValue(httpError({ status }));
      const store = createStore(draftFlow('Order lookup'));

      store.getState().applyOperation(changeName('First name'));
      await vi.advanceTimersByTimeAsync(10_000);

      expect(flowsApiMock.update).toHaveBeenCalledTimes(4);
    },
  );

  it.each([400, 404, 409])(
    'never retries a save with a %i status',
    async (status) => {
      flowsApiMock.update.mockRejectedValue(httpError({ status }));
      const store = createStore(draftFlow('Order lookup'));

      store.getState().applyOperation(changeName('First name'));
      await vi.advanceTimersByTimeAsync(10_000);

      expect(flowsApiMock.update).toHaveBeenCalledTimes(1);
    },
  );

  it('keeps the edit when a retry succeeds', async () => {
    flowsApiMock.update
      .mockRejectedValueOnce(networkError())
      .mockResolvedValue(draftFlow('First name'));
    const store = createStore(draftFlow('Order lookup'));

    store.getState().applyOperation(changeName('First name'));
    await vi.advanceTimersByTimeAsync(500);
    expect(store.getState().saving).toBe(true);

    await vi.advanceTimersByTimeAsync(10_000);

    expect(store.getState().flowVersion.displayName).toBe('First name');
    expect(store.getState().saving).toBe(false);
    expect(flowsApiMock.get).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('sends later saves after the retries, in order', async () => {
    flowsApiMock.update
      .mockRejectedValueOnce(networkError())
      .mockRejectedValueOnce(networkError())
      .mockResolvedValue(draftFlow('Second name'));
    const store = createStore(draftFlow('Order lookup'));

    store.getState().applyOperation(changeName('First name'));
    store.getState().applyOperation(changeName('Second name'));
    await vi.advanceTimersByTimeAsync(10_000);

    expect(sentOperations()).toEqual([
      changeName('First name'),
      changeName('First name'),
      changeName('First name'),
      changeName('Second name'),
    ]);
  });

  it('runs the failure path after the last retry', async () => {
    flowsApiMock.update.mockRejectedValue(networkError());
    const store = createStore(draftFlow('Order lookup'));

    store.getState().applyOperation(changeName('First name'));
    await vi.advanceTimersByTimeAsync(6_999);
    expect(toast.error).not.toHaveBeenCalled();
    expect(flowsApiMock.get).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(toast.error).toHaveBeenCalledWith(
      'Your change was not saved',
      expect.anything(),
    );
    expect(store.getState().flowVersion.displayName).toBe(
      'Name on the server',
    );

    await vi.advanceTimersByTimeAsync(10_000);
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(flowsApiMock.get).toHaveBeenCalledTimes(1);
    expect(store.getState().saving).toBe(false);
  });

  it.each([deleteBranch(), deleteSteps(), saveSampleData()])(
    'never retries a $type save',
    async (operation) => {
      flowsApiMock.update.mockRejectedValue(networkError());
      const store = createStore(draftFlow('Order lookup'));

      store.getState().applyOperation(operation);
      await vi.advanceTimersByTimeAsync(0);
      expect(toast.error).toHaveBeenCalledWith(
        'Your change was not saved',
        expect.anything(),
      );

      await vi.advanceTimersByTimeAsync(10_000);
      expect(flowsApiMock.update).toHaveBeenCalledTimes(1);
    },
  );
});

describe('flow state edit order', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    flowsApiMock.update.mockReset();
    flowsApiMock.get.mockReset();
    vi.spyOn(toast, 'error').mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sends a step edit that waits in the debounce before a later operation', async () => {
    flowsApiMock.update.mockResolvedValue(draftFlow('Order lookup'));
    const store = createStore(draftFlow('Order lookup'));

    store.getState().applyOperation(renameTrigger('New order'));
    store.getState().applyOperation(changeName('New name'));
    await vi.advanceTimersByTimeAsync(0);

    expect(sentOperations()).toEqual([
      renameTrigger('New order'),
      changeName('New name'),
    ]);
  });

  it('saves a step edit that waits in the debounce before it refetches the draft after a failed save', async () => {
    const server = serverThatKeepsTheDraft({
      rejectedType: FlowOperationType.CHANGE_NAME,
    });
    const store = createStore(draftFlow('Order lookup'));

    store.getState().applyOperation(renameTrigger('New order'));
    store.getState().applyOperation(changeName('Bad name'));
    await vi.advanceTimersByTimeAsync(5000);

    expect(server.draft().version.trigger.displayName).toBe('New order');
    expect(store.getState().flowVersion.trigger.displayName).toBe('New order');
  });
});

describe('flow state saving flag', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    flowsApiMock.update.mockReset();
    flowsApiMock.get.mockReset();
    vi.spyOn(toast, 'error').mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('stays on while an edit waits in the debounce after a save ends', async () => {
    const nameSave = Promise.withResolvers<PopulatedFlow>();
    flowsApiMock.update
      .mockReturnValueOnce(nameSave.promise)
      .mockResolvedValue(draftFlow('New name'));
    const store = createStore(draftFlow('Order lookup'));

    store.getState().applyOperation(changeName('New name'));
    await vi.advanceTimersByTimeAsync(0);
    store.getState().applyOperation(renameTrigger('New order'));
    nameSave.resolve(draftFlow('New name'));
    await vi.advanceTimersByTimeAsync(0);
    expect(store.getState().saving).toBe(true);

    await vi.advanceTimersByTimeAsync(1000);
    expect(store.getState().saving).toBe(false);
  });

  it('stays on while a pending step edit saves after a failed save', async () => {
    const triggerSave = Promise.withResolvers<PopulatedFlow>();
    flowsApiMock.update.mockImplementation(
      (_flowId: string, operation: FlowOperationRequest) =>
        operation.type === FlowOperationType.CHANGE_NAME
          ? Promise.reject(httpError({ status: 400 }))
          : triggerSave.promise,
    );
    flowsApiMock.get.mockResolvedValue(draftFlow('Order lookup'));
    const store = createStore(draftFlow('Order lookup'));

    store.getState().applyOperation(renameTrigger('New order'));
    store.getState().applyOperation(changeName('Bad name'));
    await vi.advanceTimersByTimeAsync(0);
    expect(store.getState().saving).toBe(true);

    triggerSave.resolve(draftFlow('Order lookup'));
    await vi.advanceTimersByTimeAsync(0);
    expect(store.getState().saving).toBe(false);
  });
});

function serverThatKeepsTheDraft({
  rejectedType,
}: {
  rejectedType: FlowOperationType;
}) {
  let draft = draftFlow('Order lookup');
  flowsApiMock.update.mockImplementation(
    async (_flowId: string, operation: FlowOperationRequest) => {
      if (operation.type === rejectedType) {
        throw httpError({ status: 400 });
      }
      draft = {
        ...draft,
        version: flowOperations.apply(draft.version, operation),
      };
      return draft;
    },
  );
  flowsApiMock.get.mockImplementation(async () => draft);
  return { draft: () => draft };
}

function networkError() {
  return new AxiosError('Network Error', AxiosError.ERR_NETWORK, undefined, {});
}

function serverError(message: string) {
  return httpError({
    status: 400,
    data: { code: 'FLOW_OPERATION_INVALID', params: { message } },
  });
}

function httpError({ status, data = {} }: { status: number; data?: unknown }) {
  return new AxiosError(
    `Request failed with status code ${status}`,
    status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST,
    undefined,
    {},
    {
      data,
      status,
      statusText: '',
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

function deleteBranch(): FlowOperationRequest {
  return {
    type: FlowOperationType.DELETE_BRANCH,
    request: { stepName: 'step_1', branchIndex: 0 },
  };
}

function deleteSteps(): FlowOperationRequest {
  return {
    type: FlowOperationType.DELETE_ACTION,
    request: { names: ['step_1'] },
  };
}

function saveSampleData(): FlowOperationRequest {
  return {
    type: FlowOperationType.SAVE_SAMPLE_DATA,
    request: {
      stepName: 'trigger',
      payload: { orderId: 'order-1' },
      type: SampleDataFileType.OUTPUT,
    },
  };
}

function addNote(): FlowOperationRequest {
  return {
    type: FlowOperationType.ADD_NOTE,
    request: {
      id: 'note-1',
      content: '',
      color: NoteColorVariant.YELLOW,
      position: { x: 0, y: 0 },
      size: { width: 200, height: 200 },
    },
  };
}

function updateNote(content: string): FlowOperationRequest {
  return {
    type: FlowOperationType.UPDATE_NOTE,
    request: {
      id: 'note-1',
      content,
      ownerId: null,
      color: NoteColorVariant.YELLOW,
      position: { x: 0, y: 0 },
      size: { width: 200, height: 200 },
    },
  };
}

function renameTrigger(displayName: string): FlowOperationRequest {
  return {
    type: FlowOperationType.UPDATE_TRIGGER,
    request: {
      name: 'trigger',
      valid: false,
      displayName,
      type: FlowTriggerType.EMPTY,
      settings: {},
    },
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
