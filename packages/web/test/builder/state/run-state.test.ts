// @vitest-environment jsdom
import { FlowOperationType, FlowRun, FlowVersion } from '@activepieces/shared';
import { createRunState } from '@/app/builder/state/run-state';

const mockSocket = { on: () => {}, off: () => {} } as any;
const mockFlowVersion = { id: 'fv1' } as unknown as FlowVersion;
const mockRun = { id: 'run1', steps: {} } as unknown as FlowRun;

const createMock = (getMock: () => any) => {
  const setMock = vi.fn();
  const runState = createRunState(
    { run: null, flowVersion: mockFlowVersion, socket: mockSocket },
    getMock as any,
    setMock as any,
  );
  return { runState, setMock };
};

const baseState = {
  flowVersion: mockFlowVersion,
  undoStack: [{ trigger: {} as any, notes: [], displayName: 's1' }],
  redoStack: [{ trigger: {} as any, notes: [], displayName: 's2' }],
  lastUndoOperation: { type: FlowOperationType.UPDATE_ACTION } as any,
  lastCoalesceTimeMs: 12345,
  undoRedoRevision: 3,
  loopsIndexes: {},
  userManuallySelectedStepDuringRun: false,
};

const invokeUpdater = async (
  runState: ReturnType<typeof createRunState>,
  setMock: ReturnType<typeof vi.fn>,
  flowVer: FlowVersion,
) => {
  await runState.setRun(mockRun, flowVer);
  expect(setMock).toHaveBeenCalled();
  const updater = setMock.mock.lastCall[0] as (s: any) => any;
  return updater(baseState);
};

describe('setRun', () => {
  it('preserves undo/redo history when flowVersion reference is unchanged', async () => {
    const { runState, setMock } = createMock(() => ({
      removeAllStepTestsListeners: () => {},
      flowVersion: mockFlowVersion,
    }));

    const result = await invokeUpdater(runState, setMock, mockFlowVersion);

    // Same reference → history preserved
    expect(result.undoStack).toEqual(baseState.undoStack);
    expect(result.redoStack).toEqual(baseState.redoStack);
    expect(result.lastUndoOperation).toEqual(baseState.lastUndoOperation);
    expect(result.lastCoalesceTimeMs).toBe(baseState.lastCoalesceTimeMs);
    expect(result.undoRedoRevision).toBe(baseState.undoRedoRevision);
    expect(result.readonly).toBe(true);
  });

  it('clears undo/redo history when flowVersion reference changes', async () => {
    const { runState, setMock } = createMock(() => ({
      removeAllStepTestsListeners: () => {},
      flowVersion: mockFlowVersion,
    }));

    const differentVersion = { id: 'fv2' } as unknown as FlowVersion;
    const result = await invokeUpdater(runState, setMock, differentVersion);

    // Different reference → history cleared
    expect(result.undoStack).toEqual([]);
    expect(result.redoStack).toEqual([]);
    expect(result.lastUndoOperation).toBeNull();
    expect(result.lastCoalesceTimeMs).toBe(0);
    expect(result.undoRedoRevision).toBe(0);
    expect(result.readonly).toBe(true);
  });
});
