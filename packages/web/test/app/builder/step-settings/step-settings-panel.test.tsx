// @vitest-environment jsdom
/* eslint-disable jest-dom/prefer-in-document -- @testing-library/jest-dom is not a dependency of packages/web */
import {
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
  render(
    <QueryClientProvider client={new QueryClient()}>
      <BuilderStateContext.Provider value={store}>
        <StepSettingsPanel pieceModel={undefined} pieceModelNotFound={false} />
      </BuilderStateContext.Provider>
    </QueryClientProvider>,
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
