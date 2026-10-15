// @vitest-environment jsdom
/* eslint-disable jest-dom/prefer-in-document -- @testing-library/jest-dom is not a dependency of packages/web */
import {
  BranchExecutionType,
  CodeAction,
  EmptyTrigger,
  FlowActionType,
  FlowOperationRequest,
  FlowOperationStatus,
  FlowOperationType,
  FlowStatus,
  FlowTriggerType,
  FlowVersionState,
  PopulatedFlow,
  RouterExecutionType,
  StepLocationRelativeToParent,
  flowOperations,
} from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { io } from 'socket.io-client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const savedOperations = vi.hoisted((): FlowOperationRequest[] => []);

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/features/flows/api/flows-api', () => ({
  flowsApi: {
    update: async (_flowId: string, operation: FlowOperationRequest) => {
      savedOperations.push(operation);
      return { version: { id: 'draft-1', state: 'DRAFT' } };
    },
  },
}));

vi.mock('@/app/builder/step-settings/code-settings/code-editor', () => ({
  CodeEditor: () => null,
}));

vi.mock('@/features/projects', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/projects')>()),
  projectCollectionUtils: {
    useCurrentProject: () => ({ project: { id: 'project-1' } }),
  },
}));

import {
  BuilderStateContext,
  BuilderStore,
  createBuilderStore,
} from '@/app/builder/builder-hooks';
import { StepSettingsPanel } from '@/app/builder/step-settings/step-settings-panel';
import { RightSideBarType } from '@/app/builder/types';

globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('StepSettingsPanel', () => {
  beforeEach(() => {
    savedOperations.length = 0;
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("shows an agent's change to the open step, and the person's next edit keeps it", async () => {
    const store = createStore(
      draftFlow({ lookUpOrderInput: { customerEmail: '{{trigger.email}}' } }),
    );
    store.getState().selectStepByName('step_1');
    renderPanel(store);
    expect(screen.getByDisplayValue('customerEmail')).toBeTruthy();

    act(() => {
      store.getState().applyDraftRefresh(
        draftFlow({
          lookUpOrderInput: {
            customerEmail: '{{trigger.email}}',
            orderId: '{{trigger.order}}',
          },
        }),
      );
    });

    expect(screen.getByDisplayValue('orderId')).toBeTruthy();

    fireEvent.change(screen.getByDisplayValue('customerEmail'), {
      target: { value: 'customerEmailAddress' },
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(lastSavedStepInput()).toEqual({
      customerEmailAddress: '{{trigger.email}}',
      orderId: '{{trigger.order}}',
    });
  });

  it('keeps the open form and its focus when an agent changes a different step', async () => {
    const store = createStore(
      draftFlow({ lookUpOrderInput: { customerEmail: '{{trigger.email}}' } }),
    );
    store.getState().selectStepByName('step_1');
    renderPanel(store);
    const focusedField = screen.getByDisplayValue('customerEmail');
    act(() => {
      focusedField.focus();
    });

    await act(async () => {
      store.getState().applyDraftRefresh(
        draftFlow({
          lookUpOrderInput: { customerEmail: '{{trigger.email}}' },
          sendReceiptInput: { recipient: '{{trigger.billingEmail}}' },
        }),
      );
    });

    expect(screen.getByDisplayValue('customerEmail')).toBe(focusedField);
    expect(document.activeElement).toBe(focusedField);
  });

  it("keeps the open form when the refresh carries the person's own saved edit", async () => {
    const flow = draftFlow({
      lookUpOrderInput: { customerEmail: '{{trigger.email}}' },
    });
    const store = createStore(flow);
    store.getState().selectStepByName('step_1');
    renderPanel(store);
    const focusedField = screen.getByDisplayValue('customerEmail');
    act(() => {
      focusedField.focus();
    });
    fireEvent.change(focusedField, {
      target: { value: 'customerEmailAddress' },
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    await act(async () => {
      store.getState().applyDraftRefresh(
        draftFromServer({
          flow,
          operations: [
            ...savedOperations,
            {
              type: FlowOperationType.UPDATE_ACTION,
              request: sendReceiptStep({
                recipient: '{{trigger.billingEmail}}',
              }),
            },
          ],
        }),
      );
    });

    expect(screen.getByDisplayValue('customerEmailAddress')).toBe(focusedField);
    expect(document.activeElement).toBe(focusedField);
  });

  it('closes the panel when a different writer deletes the open step', () => {
    const flow = draftFlow({
      lookUpOrderInput: { customerEmail: '{{trigger.email}}' },
    });
    const store = createStore(flow);
    store.getState().selectStepByName('step_2');
    renderPanel(store);
    expect(screen.getByDisplayValue('recipient')).toBeTruthy();
    const consoleError = vi.spyOn(console, 'error');

    act(() => {
      store.getState().applyDraftRefresh(draftWithoutSendReceipt(flow));
    });

    expect(screen.queryByDisplayValue('recipient')).toBeNull();
    expect(store.getState()).toMatchObject({
      selectedStep: null,
      rightSidebar: RightSideBarType.NONE,
      selectedBranchIndex: null,
    });
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('keeps the versions list open when a different writer deletes the selected step', () => {
    const flow = draftFlow({
      lookUpOrderInput: { customerEmail: '{{trigger.email}}' },
    });
    const store = createStore(flow);
    store.getState().selectStepByName('step_2');
    store.getState().setRightSidebar(RightSideBarType.VERSIONS);

    store.getState().applyDraftRefresh(draftWithoutSendReceipt(flow));

    expect(store.getState()).toMatchObject({
      selectedStep: null,
      rightSidebar: RightSideBarType.VERSIONS,
      selectedBranchIndex: null,
    });
  });

  it('keeps the open sidebar and the selected branch when the open step stays', () => {
    const store = createStore(
      flowWithRouter({ routerDisplayName: 'Route by country' }),
    );
    store.getState().selectStepByName('step_3');
    store.getState().setSelectedBranchIndex(1);

    store
      .getState()
      .applyDraftRefresh(
        flowWithRouter({ routerDisplayName: 'Route by region' }),
      );

    expect(store.getState()).toMatchObject({
      selectedStep: 'step_3',
      rightSidebar: RightSideBarType.PIECE_SETTINGS,
      selectedBranchIndex: 1,
    });
  });

  it('makes the mention field read-only when the tab becomes read-only, and sends no save', async () => {
    const store = createStore(
      draftFlow({ lookUpOrderInput: { customerEmail: '{{trigger.email}}' } }),
    );
    store.getState().selectStepByName('step_1');
    const { container } = renderPanel(store);
    expect(mentionFieldEditableStates(container)).toEqual(['true']);

    act(() => {
      store.getState().setReadOnly(true);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(mentionFieldEditableStates(container)).toEqual(['false']);
    expect(savedOperations).toEqual([]);
  });

  it('makes the mention field editable when the tab becomes editable, and sends no save', async () => {
    const store = createStore(
      draftFlow({ lookUpOrderInput: { customerEmail: '{{trigger.email}}' } }),
    );
    store.getState().setReadOnly(true);
    store.getState().selectStepByName('step_1');
    const { container } = renderPanel(store);
    expect(mentionFieldEditableStates(container)).toEqual(['false']);

    act(() => {
      store.getState().setReadOnly(false);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(mentionFieldEditableStates(container)).toEqual(['true']);
    expect(savedOperations).toEqual([]);
  });
});

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

function renderPanel(store: BuilderStore) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <BuilderStateContext.Provider value={store}>
        <StepSettingsPanel pieceModel={undefined} pieceModelNotFound={false} />
      </BuilderStateContext.Provider>
    </QueryClientProvider>,
  );
}

function mentionFieldEditableStates(container: HTMLElement) {
  return Array.from(container.querySelectorAll('.ProseMirror')).map((element) =>
    element.getAttribute('contenteditable'),
  );
}

function lastSavedStepInput() {
  const stepUpdates = savedOperations.filter(
    (operation) => operation.type === FlowOperationType.UPDATE_ACTION,
  );
  const lastUpdate = stepUpdates[stepUpdates.length - 1];
  if (lastUpdate?.type !== FlowOperationType.UPDATE_ACTION) {
    return undefined;
  }
  return lastUpdate.request.type === FlowActionType.CODE
    ? lastUpdate.request.settings.input
    : undefined;
}

function draftFlow({
  lookUpOrderInput,
  sendReceiptInput = { recipient: '{{trigger.email}}' },
}: DraftFlowParams): PopulatedFlow {
  const lookUpOrder: CodeAction = {
    ...codeStep({
      name: 'step_1',
      displayName: 'Look up order',
      input: lookUpOrderInput,
    }),
    nextAction: sendReceiptStep(sendReceiptInput),
  };
  const trigger: EmptyTrigger = {
    name: 'trigger',
    valid: false,
    displayName: 'Select Trigger',
    type: FlowTriggerType.EMPTY,
    settings: {},
    lastUpdatedDate: '2026-01-01T00:00:00.000Z',
    nextAction: lookUpOrder,
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
      displayName: 'Order lookup',
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

function draftFromServer({
  flow,
  operations,
}: {
  flow: PopulatedFlow;
  operations: FlowOperationRequest[];
}): PopulatedFlow {
  const version = operations.reduce(
    (draft, operation) => flowOperations.apply(draft, operation),
    flow.version,
  );
  return PopulatedFlow.parse(JSON.parse(JSON.stringify({ ...flow, version })));
}

function draftWithoutSendReceipt(flow: PopulatedFlow): PopulatedFlow {
  return draftFromServer({
    flow,
    operations: [
      {
        type: FlowOperationType.DELETE_ACTION,
        request: { names: ['step_2'] },
      },
    ],
  });
}

function flowWithRouter({
  routerDisplayName,
}: {
  routerDisplayName: string;
}): PopulatedFlow {
  return draftFromServer({
    flow: draftFlow({
      lookUpOrderInput: { customerEmail: '{{trigger.email}}' },
    }),
    operations: [
      {
        type: FlowOperationType.ADD_ACTION,
        request: {
          parentStep: 'step_2',
          stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
          action: {
            name: 'step_3',
            type: FlowActionType.ROUTER,
            displayName: routerDisplayName,
            valid: true,
            settings: {
              executionType: RouterExecutionType.EXECUTE_FIRST_MATCH,
              branches: [
                {
                  branchName: 'Europe',
                  branchType: BranchExecutionType.CONDITION,
                  conditions: [[]],
                },
                {
                  branchName: 'Otherwise',
                  branchType: BranchExecutionType.FALLBACK,
                },
              ],
            },
          },
        },
      },
    ],
  });
}

function sendReceiptStep(input: Record<string, string>): CodeAction {
  return codeStep({ name: 'step_2', displayName: 'Send receipt', input });
}

function codeStep({
  name,
  displayName,
  input,
}: {
  name: string;
  displayName: string;
  input: Record<string, string>;
}): CodeAction {
  return {
    name,
    valid: true,
    displayName,
    lastUpdatedDate: '2026-01-01T00:00:00.000Z',
    type: FlowActionType.CODE,
    settings: {
      sourceCode: {
        code: 'export const code = async (inputs) => inputs;',
        packageJson: '{}',
      },
      input,
      errorHandlingOptions: {},
    },
  };
}

type DraftFlowParams = {
  lookUpOrderInput: Record<string, string>;
  sendReceiptInput?: Record<string, string>;
};
