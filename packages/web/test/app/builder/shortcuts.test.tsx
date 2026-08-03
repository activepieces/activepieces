/**
 * @vitest-environment jsdom
 */
/* eslint-disable testing-library/no-unnecessary-act */
import {
  FlowOperationStatus,
  FlowOperationType,
  FlowStatus,
  FlowTriggerType,
  FlowVersionState,
  PopulatedFlow,
} from '@activepieces/shared';
import { QueryClient } from '@tanstack/react-query';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { io } from 'socket.io-client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  BuilderStateContext,
  BuilderStore,
  createBuilderStore,
} from '@/app/builder/builder-hooks';
import { useHandleKeyPressOnCanvas } from '@/app/builder/shortcuts';

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function buildFlow(): PopulatedFlow {
  const now = new Date().toISOString();
  return {
    id: 'flow-1',
    created: now,
    updated: now,
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
      created: now,
      updated: now,
      flowId: 'flow-1',
      displayName: 'Test flow',
      updatedBy: null,
      valid: true,
      schemaVersion: null,
      agentIds: [],
      state: FlowVersionState.DRAFT,
      connectionIds: [],
      backupFiles: null,
      notes: [],
      trigger: {
        name: 'trigger',
        valid: true,
        displayName: 'Trigger',
        type: FlowTriggerType.EMPTY,
        settings: {},
        lastUpdatedDate: now,
        nextAction: {
          name: 'step_1',
          valid: true,
          displayName: 'Step 1',
          type: 'CODE',
          settings: {},
          skip: false,
        },
      },
    },
  };
}

function createStore(): BuilderStore {
  const flow = buildFlow();
  return createBuilderStore({
    flow,
    flowVersion: flow.version,
    readonly: false,
    hideTestWidget: false,
    run: null,
    outputSampleData: {},
    inputSampleData: {},
    socket: io('http://localhost', { autoConnect: false }),
    queryClient: new QueryClient(),
  });
}

function Probe() {
  useHandleKeyPressOnCanvas();
  return null;
}

function dispatchKeyFrom(target: HTMLElement, init: KeyboardEventInit): void {
  target.dispatchEvent(
    new KeyboardEvent('keydown', { bubbles: true, ...init }),
  );
}

let container: HTMLDivElement | null = null;
let root: Root | null = null;

async function setup() {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  const store = createStore();
  const applyOperation = vi.fn();
  store.setState({ applyOperation });
  store.getState().selectStepByName('step_1');
  const mountedRoot = root;
  await act(async () => {
    mountedRoot.render(
      <BuilderStateContext.Provider value={store}>
        <Probe />
      </BuilderStateContext.Provider>,
    );
  });
  return { container, applyOperation };
}

describe('canvas shortcuts while editing step inputs (GIT-1445)', () => {
  afterEach(async () => {
    const mountedRoot = root;
    if (mountedRoot) {
      await act(async () => {
        mountedRoot.unmount();
      });
    }
    container?.remove();
    root = null;
    container = null;
  });

  it.each(['input', 'textarea', 'select'] as const)(
    'ignores Ctrl+E when focus is in a %s',
    async (tagName) => {
      const { container, applyOperation } = await setup();
      const field = document.createElement(tagName);
      container.appendChild(field);
      dispatchKeyFrom(field, { key: 'e', ctrlKey: true });
      expect(applyOperation).not.toHaveBeenCalled();
    },
  );

  it('ignores Ctrl+E when focus is in a contenteditable element', async () => {
    const { container, applyOperation } = await setup();
    const editor = document.createElement('div');
    Object.defineProperty(editor, 'isContentEditable', { value: true });
    container.appendChild(editor);
    dispatchKeyFrom(editor, { key: 'e', ctrlKey: true });
    expect(applyOperation).not.toHaveBeenCalled();
  });

  it('ignores Shift+Delete when focus is in an input', async () => {
    const { container, applyOperation } = await setup();
    const field = document.createElement('input');
    container.appendChild(field);
    dispatchKeyFrom(field, { key: 'Delete', shiftKey: true });
    expect(applyOperation).not.toHaveBeenCalled();
  });

  it('still toggles skip with Ctrl+E when focus is on the canvas', async () => {
    const { applyOperation } = await setup();
    dispatchKeyFrom(document.body, { key: 'e', ctrlKey: true });
    expect(applyOperation).toHaveBeenCalledTimes(1);
    expect(applyOperation).toHaveBeenCalledWith({
      type: FlowOperationType.SET_SKIP_ACTION,
      request: { names: ['step_1'], skip: true },
    });
  });

  it('still deletes the selected step with Shift+Delete on the canvas', async () => {
    const { applyOperation } = await setup();
    dispatchKeyFrom(document.body, { key: 'Delete', shiftKey: true });
    expect(applyOperation).toHaveBeenCalledWith({
      type: FlowOperationType.DELETE_ACTION,
      request: { names: ['step_1'] },
    });
  });
});
