// @vitest-environment jsdom
import { tryCatch } from '@activepieces/core-utils';
import {
  CodeAction,
  EmptyTrigger,
  FlowActionType,
  FlowOperationRequest,
  FlowOperationStatus,
  FlowOperationType,
  FlowRun,
  FlowRunStatus,
  FlowStatus,
  FlowTriggerType,
  FlowVersionState,
  NoteColorVariant,
  PopulatedFlow,
  RunEnvironment,
  SampleDataFileType,
  flowOperations,
} from '@activepieces/shared';
import { QueryClient } from '@tanstack/react-query';
import { AxiosError, AxiosHeaders } from 'axios';
import { toast } from 'sonner';
import { io } from 'socket.io-client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BuilderStore, createBuilderStore } from '@/app/builder/builder-hooks';
import { RightSideBarType } from '@/app/builder/types';

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
    expect(store.getState().flowVersion.displayName).toBe('Name on the server');

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

describe('flow state pending edits made during a save of pending edits', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    flowsApiMock.update.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('settles only after an edit made during the wait is saved', async () => {
    const firstSave = Promise.withResolvers<PopulatedFlow>();
    const laterSave = Promise.withResolvers<PopulatedFlow>();
    flowsApiMock.update
      .mockReturnValueOnce(firstSave.promise)
      .mockReturnValueOnce(laterSave.promise);
    const store = createStore(draftFlow('Order lookup'));
    const settled = vi.fn();

    store.getState().applyOperation(renameTrigger('New order'));
    const savingEdits = store.getState().savePendingEdits().then(settled);
    store.getState().applyOperation(renameTrigger('Newer order'));
    firstSave.resolve(draftFlow('Order lookup'));
    await vi.advanceTimersByTimeAsync(0);

    expect(sentOperations()).toEqual([
      renameTrigger('New order'),
      renameTrigger('Newer order'),
    ]);
    expect(settled).not.toHaveBeenCalled();

    laterSave.resolve(draftFlow('Order lookup'));
    await savingEdits;
    expect(settled).toHaveBeenCalled();
  });
});

describe('flow state request timeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    flowsApiMock.update.mockReset();
    flowsApiMock.get.mockReset();
    vi.spyOn(toast, 'error').mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fails a save that gets no answer in 60 s', async () => {
    flowsApiMock.update.mockReturnValue(new Promise(() => undefined));
    flowsApiMock.get.mockResolvedValue(draftFlow('Order lookup'));
    const store = createStore(draftFlow('Order lookup'));

    store.getState().applyOperation(deleteSteps());
    const savingEdits = tryCatch(() => store.getState().savePendingEdits());
    await vi.advanceTimersByTimeAsync(59_999);
    expect(toast.error).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    const { error } = await savingEdits;
    expect(error?.message).toBe('timeout of 60000ms exceeded');
    expect(toast.error).toHaveBeenCalledWith(
      'Your change was not saved',
      expect.anything(),
    );
    expect(store.getState().saving).toBe(false);
  });

  it('retries an idempotent save that gets no answer in 60 s', async () => {
    flowsApiMock.update
      .mockReturnValueOnce(new Promise(() => undefined))
      .mockResolvedValue(draftFlow('New name'));
    const store = createStore(draftFlow('Order lookup'));

    store.getState().applyOperation(changeName('New name'));
    await vi.advanceTimersByTimeAsync(60_999);
    expect(flowsApiMock.update).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1);
    expect(flowsApiMock.update).toHaveBeenCalledTimes(2);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('fails a draft refetch that gets no answer in 60 s, and saves the next edit', async () => {
    flowsApiMock.update
      .mockRejectedValueOnce(httpError({ status: 400 }))
      .mockResolvedValue(draftFlow('Second name'));
    flowsApiMock.get.mockReturnValue(new Promise(() => undefined));
    const store = createStore(draftFlow('Order lookup'));

    store.getState().applyOperation(changeName('First name'));
    await vi.advanceTimersByTimeAsync(60_000);
    expect(toast.error).toHaveBeenCalledWith(
      'Something went wrong',
      expect.anything(),
    );

    store.getState().applyOperation(changeName('Second name'));
    await vi.advanceTimersByTimeAsync(0);
    expect(sentOperations()).toEqual([
      changeName('First name'),
      changeName('Second name'),
    ]);
  });
});

describe('flow state draft check before Publish', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    flowsApiMock.update.mockReset();
    flowsApiMock.get.mockReset();
    vi.spyOn(toast, 'error').mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sends no request when no save failed', async () => {
    const store = createStore(draftFlow('Order lookup'));

    await store.getState().refreshDraftAfterFailedSave();

    expect(flowsApiMock.get).not.toHaveBeenCalled();
  });

  it('refetches the draft when the refetch after a failed save failed', async () => {
    flowsApiMock.update.mockRejectedValue(httpError({ status: 400 }));
    flowsApiMock.get
      .mockRejectedValueOnce(networkError())
      .mockResolvedValue(draftFlow('Name on the server'));
    const store = createStore(draftFlow('Order lookup'));

    store.getState().applyOperation(changeName('Bad name'));
    await vi.advanceTimersByTimeAsync(0);
    expect(store.getState().flowVersion.displayName).toBe('Bad name');

    await store.getState().refreshDraftAfterFailedSave();

    expect(flowsApiMock.get).toHaveBeenCalledTimes(2);
    expect(store.getState().flowVersion.displayName).toBe(
      'Name on the server',
    );
  });

  it('fails when the draft cannot be refetched after a failed save', async () => {
    flowsApiMock.update.mockRejectedValue(httpError({ status: 400 }));
    flowsApiMock.get.mockRejectedValue(networkError());
    const store = createStore(draftFlow('Order lookup'));

    store.getState().applyOperation(changeName('Bad name'));
    await vi.advanceTimersByTimeAsync(0);
    const { error } = await tryCatch(() =>
      store.getState().refreshDraftAfterFailedSave(),
    );

    expect(error?.message).toBe('Network Error');
  });

  it('sends no request after a Draft Refresh showed the failed save', async () => {
    flowsApiMock.update.mockRejectedValue(httpError({ status: 400 }));
    flowsApiMock.get.mockResolvedValue(draftFlow('Name on the server'));
    const store = createStore(draftFlow('Order lookup'));

    store.getState().applyOperation(changeName('Bad name'));
    await vi.advanceTimersByTimeAsync(0);
    await store.getState().refreshDraftAfterFailedSave();

    expect(flowsApiMock.get).toHaveBeenCalledTimes(1);
  });
});

describe('flow state draft refresh after a failed save', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    flowsApiMock.update.mockReset();
    flowsApiMock.get.mockReset();
    vi.spyOn(toast, 'error').mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps the open step panel', async () => {
    serveDraft(flowWithLookUpOrderStep());
    const store = createStore(flowWithLookUpOrderStep());
    store.getState().selectStepByName('step_1');

    store.getState().applyOperation(changeName(NAME_THE_SERVER_REJECTS));
    await vi.advanceTimersByTimeAsync(0);

    expect(store.getState()).toMatchObject({
      selectedStep: 'step_1',
      rightSidebar: RightSideBarType.PIECE_SETTINGS,
    });
    expect(store.getState().flowVersion.displayName).toBe('Order lookup');
  });

  it('saves an edit inside the debounce before the refetch, and shows it', async () => {
    serveDraft(flowWithLookUpOrderStep());
    const store = createStore(flowWithLookUpOrderStep());

    store.getState().applyOperation(renameTrigger('New order'));
    store.getState().applyOperation(changeName(NAME_THE_SERVER_REJECTS));
    await vi.advanceTimersByTimeAsync(10_000);

    expect(store.getState().flowVersion).toMatchObject({
      displayName: 'Order lookup',
      trigger: { displayName: 'New order' },
    });
  });

  it('does not apply a refetched draft while an edit waits, and fetches again', async () => {
    const server = serveDraft(flowWithLookUpOrderStep());
    const firstResponse = Promise.withResolvers<void>();
    flowsApiMock.get.mockImplementationOnce(async () => {
      const draftWithoutTheEdit = server.currentFlow();
      await firstResponse.promise;
      return draftWithoutTheEdit;
    });
    const store = createStore(flowWithLookUpOrderStep());

    store.getState().applyOperation(changeName(NAME_THE_SERVER_REJECTS));
    await vi.advanceTimersByTimeAsync(0);
    store.getState().applyOperation(renameTrigger('New order'));
    firstResponse.resolve();
    await vi.advanceTimersByTimeAsync(0);

    expect(store.getState().flowVersion.trigger.displayName).toBe('New order');

    await vi.advanceTimersByTimeAsync(10_000);

    expect(flowsApiMock.get).toHaveBeenCalledTimes(2);
    expect(store.getState().flowVersion).toMatchObject({
      displayName: 'Order lookup',
      trigger: { displayName: 'New order' },
    });
  });

  it('does not apply a refetched draft when a save ends during the request, and fetches again', async () => {
    const server = serveDraft(flowWithLookUpOrderStep());
    const firstResponse = Promise.withResolvers<void>();
    flowsApiMock.get.mockImplementationOnce(async () => {
      const draftWithoutTheSave = server.currentFlow();
      await firstResponse.promise;
      return draftWithoutTheSave;
    });
    const store = createStore(flowWithLookUpOrderStep());

    store.getState().applyOperation(changeName(NAME_THE_SERVER_REJECTS));
    await vi.advanceTimersByTimeAsync(0);
    store.getState().applyOperation(changeName('Order lookup by email'));
    await vi.advanceTimersByTimeAsync(0);
    firstResponse.resolve();
    await vi.advanceTimersByTimeAsync(10_000);

    expect(flowsApiMock.get).toHaveBeenCalledTimes(2);
    expect(store.getState().flowVersion.displayName).toBe(
      'Order lookup by email',
    );
  });
});

describe('flow state draft refresh', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    flowsApiMock.update.mockReset();
    flowsApiMock.get.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('waits for a pause in the typing before it fetches the draft again', async () => {
    const server = serveDraft(
      withDisplayName({
        flow: flowWithLookUpOrderStep(),
        displayName: 'Order lookup by an agent',
      }),
    );
    const firstResponse = Promise.withResolvers<void>();
    flowsApiMock.get.mockImplementationOnce(async () => {
      const draftBeforeTheTyping = server.currentFlow();
      await firstResponse.promise;
      return draftBeforeTheTyping;
    });
    const store = createStore(flowWithLookUpOrderStep());

    const refresh = store.getState().refreshDraft();
    await vi.advanceTimersByTimeAsync(0);
    store.getState().applyOperation(renameTrigger('N'));
    firstResponse.resolve();
    for (const displayName of ['Ne', 'New', 'New o', 'New order']) {
      await vi.advanceTimersByTimeAsync(300);
      store.getState().applyOperation(renameTrigger(displayName));
    }
    await vi.advanceTimersByTimeAsync(300);
    expect(flowsApiMock.get).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1000);
    await refresh;

    expect(sentOperations()).toEqual([renameTrigger('New order')]);
    expect(flowsApiMock.get).toHaveBeenCalledTimes(2);
    expect(store.getState().flowVersion).toMatchObject({
      displayName: 'Order lookup by an agent',
      trigger: { displayName: 'New order' },
    });
  });

  it('does not replace a run that the tab opens while the draft request runs', async () => {
    const response = Promise.withResolvers<PopulatedFlow>();
    flowsApiMock.get.mockReturnValue(response.promise);
    const store = createStore(flowWithLookUpOrderStep());

    const refresh = store.getState().refreshDraft();
    await vi.advanceTimersByTimeAsync(0);
    store.getState().setRun(testRun(), {
      ...store.getState().flowVersion,
      displayName: 'Order lookup at the time of the run',
    });
    response.resolve(
      withDisplayName({
        flow: flowWithLookUpOrderStep(),
        displayName: 'Order lookup by an agent',
      }),
    );

    await expect(refresh).resolves.toBe(false);
    expect(store.getState().flowVersion.displayName).toBe(
      'Order lookup at the time of the run',
    );
  });

  it('ignores the published version that the tab opens after its own save created the draft', async () => {
    const published = publishedFlowWithNoDraft();
    flowsApiMock.update.mockResolvedValue(flowWithLookUpOrderStep());
    flowsApiMock.get.mockResolvedValue(flowWithLookUpOrderStep());
    const store = createStore(published);

    store.getState().applyOperation(changeName('Order lookup by email'));
    await vi.advanceTimersByTimeAsync(0);
    store.getState().setVersion(published.version);

    await expect(store.getState().refreshDraft()).resolves.toBe(false);
    expect(flowsApiMock.get).not.toHaveBeenCalled();
  });

  it('ignores the published version that the tab opens after it showed a new draft', async () => {
    const published = publishedFlowWithNoDraft();
    flowsApiMock.get.mockResolvedValue(flowWithLookUpOrderStep());
    const store = createStore(published);

    store.getState().setVersion(flowWithLookUpOrderStep().version);
    store.getState().setVersion(published.version);

    await expect(store.getState().refreshDraft()).resolves.toBe(false);
    expect(flowsApiMock.get).not.toHaveBeenCalled();
  });

  it('ignores a version under review that the tab opened by its id', async () => {
    const published = publishedFlowWithNoDraft();
    const underReview: PopulatedFlow = {
      ...published,
      version: { ...published.version, id: 'version-2' },
    };
    flowsApiMock.get.mockResolvedValue(flowWithLookUpOrderStep());
    const store = createStore(underReview);

    await expect(store.getState().refreshDraft()).resolves.toBe(false);
    expect(flowsApiMock.get).not.toHaveBeenCalled();
  });

  it('sends one GET at a time when a refresh starts as the previous refresh ends', async () => {
    const server = serveDraft(flowWithLookUpOrderStep());
    let getsInFlight = 0;
    let mostGetsInFlight = 0;
    flowsApiMock.get.mockImplementation(async () => {
      getsInFlight++;
      mostGetsInFlight = Math.max(mostGetsInFlight, getsInFlight);
      await new Promise((resolve) => setTimeout(resolve, 100));
      getsInFlight--;
      return server.currentFlow();
    });
    const store = createStore(flowWithLookUpOrderStep());

    const firstRefresh = store.getState().refreshDraft();
    const queuedRefresh = store.getState().refreshDraft();
    const refreshAsTheFirstEnds = firstRefresh.then(() =>
      store.getState().refreshDraft(),
    );
    await vi.advanceTimersByTimeAsync(1000);
    await Promise.all([queuedRefresh, refreshAsTheFirstEnds]);

    expect(mostGetsInFlight).toBe(1);
    expect(flowsApiMock.get).toHaveBeenCalledTimes(2);
  });
});

function testRun(): FlowRun {
  return {
    id: 'run-1',
    created: '2026-01-01T00:00:00.000Z',
    updated: '2026-01-01T00:00:00.000Z',
    projectId: 'project-1',
    flowId: 'flow-1',
    flowVersionId: 'draft-1',
    failParentOnFailure: false,
    logsFileId: null,
    status: FlowRunStatus.SUCCEEDED,
    environment: RunEnvironment.TESTING,
    steps: {},
    tags: [],
    archivedAt: null,
  };
}

function withDisplayName({
  flow,
  displayName,
}: {
  flow: PopulatedFlow;
  displayName: string;
}): PopulatedFlow {
  return { ...flow, version: { ...flow.version, displayName } };
}

function serveDraft(flow: PopulatedFlow) {
  let draft = flow.version;
  const currentFlow = (): PopulatedFlow => ({ ...flow, version: draft });
  flowsApiMock.update.mockImplementation(
    async (_flowId: string, operation: FlowOperationRequest) => {
      if (
        operation.type === FlowOperationType.CHANGE_NAME &&
        operation.request.displayName === NAME_THE_SERVER_REJECTS
      ) {
        throw httpError({ status: 400 });
      }
      draft = flowOperations.apply(draft, operation);
      return currentFlow();
    },
  );
  flowsApiMock.get.mockImplementation(async () => currentFlow());
  return { currentFlow };
}

function publishedFlowWithNoDraft(): PopulatedFlow {
  const flow = flowWithLookUpOrderStep();
  return {
    ...flow,
    publishedVersionId: 'version-1',
    version: {
      ...flow.version,
      id: 'version-1',
      state: FlowVersionState.LOCKED,
    },
  };
}

function flowWithLookUpOrderStep(): PopulatedFlow {
  const flow = draftFlow('Order lookup');
  return {
    ...flow,
    version: {
      ...flow.version,
      trigger: { ...flow.version.trigger, nextAction: lookUpOrderStep() },
    },
  };
}

function lookUpOrderStep(): CodeAction {
  return {
    name: 'step_1',
    valid: true,
    displayName: 'Look up order',
    lastUpdatedDate: '2026-01-01T00:00:00.000Z',
    type: FlowActionType.CODE,
    settings: {
      sourceCode: {
        code: 'export const code = async (inputs) => inputs;',
        packageJson: '{}',
      },
      input: {},
      errorHandlingOptions: {},
    },
  };
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

const NAME_THE_SERVER_REJECTS = 'Name the server rejects';
