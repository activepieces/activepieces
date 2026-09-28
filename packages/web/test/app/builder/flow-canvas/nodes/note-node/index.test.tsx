/**
 * @vitest-environment jsdom
 */
import {
  FlowOperationRequest,
  FlowOperationStatus,
  FlowOperationType,
  FlowStatus,
  FlowTriggerType,
  FlowVersionState,
  NoteColorVariant,
  PopulatedFlow,
} from '@activepieces/shared';
import { QueryClient } from '@tanstack/react-query';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { forwardRef } from 'react';
import { io } from 'socket.io-client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/components/custom/markdown-input', () => ({
  MarkdownInput: forwardRef<
    null,
    { initialValue: string; onChange: (value: string) => void }
  >(function MarkdownInputMock({ initialValue, onChange }, _ref) {
    return (
      <textarea
        data-testid="note-editor"
        defaultValue={initialValue}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }),
}));

vi.mock('@/app/builder/flow-canvas/nodes/note-node/note-footer', () => ({
  NoteFooter: () => null,
}));

import {
  BuilderStateContext,
  BuilderStore,
  createBuilderStore,
  useBuilderStateContext,
} from '@/app/builder/builder-hooks';
import { NoteContent } from '@/app/builder/flow-canvas/nodes/note-node';

const NOTE_ID = 'note-1';

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
      notes: [
        {
          id: NOTE_ID,
          content: 'old text',
          ownerId: null,
          color: NoteColorVariant.YELLOW,
          position: { x: 0, y: 0 },
          size: { width: 200, height: 200 },
          createdAt: now,
          updatedAt: now,
        },
      ],
      trigger: {
        name: 'trigger',
        valid: true,
        displayName: 'Trigger',
        type: FlowTriggerType.EMPTY,
        settings: {},
        lastUpdatedDate: now,
      },
    },
  };
}

function createStore(): BuilderStore {
  const flow = buildFlow();
  const store = createBuilderStore({
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
  store.setState({
    applyOperation: (operation: FlowOperationRequest) => {
      if (operation.type !== FlowOperationType.UPDATE_NOTE) {
        return;
      }
      const flowVersion = store.getState().flowVersion;
      store.setState({
        flowVersion: {
          ...flowVersion,
          notes: flowVersion.notes.map((note) =>
            note.id === operation.request.id
              ? { ...note, content: operation.request.content }
              : note,
          ),
        },
      });
    },
  });
  return store;
}

function StoredNote({ mountKey }: { mountKey: string }) {
  const note = useBuilderStateContext((state) => state.getNoteById(NOTE_ID));
  if (note === null) {
    return null;
  }
  return <NoteContent key={mountKey} note={note} isDragging={false} />;
}

function renderNote() {
  const store = createStore();
  const view = render(
    <BuilderStateContext.Provider value={store}>
      <StoredNote mountKey="a" />
    </BuilderStateContext.Provider>,
  );
  const remount = () =>
    view.rerender(
      <BuilderStateContext.Provider value={store}>
        <StoredNote mountKey="b" />
      </BuilderStateContext.Provider>,
    );
  const storedContent = () => store.getState().getNoteById(NOTE_ID)?.content;
  return { view, remount, storedContent };
}

function editor(): HTMLTextAreaElement {
  return screen.getByTestId<HTMLTextAreaElement>('note-editor');
}

describe('sticky note content save (ENG-545)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('saves text typed inside the debounce window when the note unmounts', () => {
    const { view, storedContent } = renderNote();
    fireEvent.change(editor(), { target: { value: 'new text' } });
    view.unmount();
    expect(storedContent()).toBe('new text');
  });

  it('shows the latest text after the editor loses focus and the note remounts', () => {
    const { remount, storedContent } = renderNote();
    fireEvent.change(editor(), { target: { value: 'new text' } });
    fireEvent.blur(editor());
    remount();
    expect(storedContent()).toBe('new text');
    expect(editor().value).toBe('new text');
  });

  it('still saves after the debounce delay while the note stays mounted', () => {
    const { storedContent } = renderNote();
    fireEvent.change(editor(), { target: { value: 'new text' } });
    expect(storedContent()).toBe('old text');
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(storedContent()).toBe('new text');
  });
});
