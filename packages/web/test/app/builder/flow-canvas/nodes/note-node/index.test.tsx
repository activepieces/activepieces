// @vitest-environment jsdom
import {
  EmptyTrigger,
  FlowOperationRequest,
  FlowOperationStatus,
  FlowOperationType,
  FlowStatus,
  FlowTriggerType,
  FlowVersionState,
  Note,
  NoteColorVariant,
  PopulatedFlow,
} from '@activepieces/shared';
import { QueryClient } from '@tanstack/react-query';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { io } from 'socket.io-client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  BuilderStateContext,
  BuilderStore,
  createBuilderStore,
} from '@/app/builder/builder-hooks';
import { flowCanvasHooks } from '@/app/builder/flow-canvas/hooks';
import { NoteContent } from '@/app/builder/flow-canvas/nodes/note-node';

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const flowsApiMock = vi.hoisted(() => ({
  update:
    vi.fn<
      (
        flowId: string,
        operation: FlowOperationRequest,
      ) => Promise<PopulatedFlow>
    >(),
  get: vi.fn<(flowId: string) => Promise<PopulatedFlow>>(),
}));

const noteEditor = vi.hoisted((): { type: (value: string) => void } => ({
  type: () => undefined,
}));

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/features/flows/api/flows-api', () => ({
  flowsApi: flowsApiMock,
}));

vi.mock('@/components/custom/markdown-input', () => ({
  MarkdownInput: ({ onChange }: { onChange: (value: string) => void }) => {
    noteEditor.type = onChange;
    return null;
  },
}));

describe('NoteContent', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    flowsApiMock.update.mockReset();
    flowsApiMock.update.mockResolvedValue(flowWithNote(note()));
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.useRealTimers();
  });

  it('saves a note edit typed just before the builder unmounts', async () => {
    const store = createStore(flowWithNote(note()));
    act(() => {
      root.render(
        <BuilderStateContext.Provider value={store}>
          <BuilderWithNote />
        </BuilderStateContext.Provider>,
      );
    });

    act(() => noteEditor.type('Call the customer'));
    act(() => root.unmount());
    await vi.advanceTimersByTimeAsync(0);

    expect(sentOperations()).toEqual([
      {
        type: FlowOperationType.UPDATE_NOTE,
        request: expect.objectContaining({
          id: 'note-1',
          content: 'Call the customer',
        }),
      },
    ]);
  });
});

function BuilderWithNote() {
  flowCanvasHooks.useFlushPendingEditsOnLeave();
  return <NoteContent note={note()} isDragging={false} />;
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

function note(): Note {
  return {
    id: 'note-1',
    content: 'Check the order',
    ownerId: null,
    color: NoteColorVariant.YELLOW,
    position: { x: 0, y: 0 },
    size: { width: 200, height: 200 },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function flowWithNote(flowNote: Note): PopulatedFlow {
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
      displayName: 'Order lookup',
      trigger,
      updatedBy: null,
      valid: false,
      schemaVersion: null,
      agentIds: [],
      state: FlowVersionState.DRAFT,
      connectionIds: [],
      backupFiles: null,
      notes: [flowNote],
    },
  };
}
