/**
 * @vitest-environment jsdom
 *
 * Regression test for https://github.com/activepieces/activepieces/issues/13554
 *
 * useFlowLock decides how the builder refreshes after a lock take-over: when a
 * run is being viewed it navigates client-side to /flows/:id (embed-safe),
 * otherwise it refreshes the draft in place with switchToDraft(). Neither path
 * may call window.location.reload() — a document reload does not survive embed
 * mode (the iframe re-mounts without the embed SDK handshake). The branch is
 * driven by the builder run state rather than window.location, because embed
 * mounts a memory router and window.location never reflects the in-app route.
 *
 * This file uses raw `react-dom` + React's `act` rather than
 * @testing-library/react (which is not a dependency of this package).
 */
/* eslint-disable testing-library/no-unnecessary-act */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useFlowLock } from '@/app/builder/flow-canvas/widgets/use-flow-lock';

declare global {
  // Tells React the test wraps updates in act(); see React's act() docs.
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const FLOW_ID = 'flow-1';

const harness = vi.hoisted(() => {
  type FakeBuilderState = {
    readonly: boolean;
    flow: { id: string };
    setReadOnly: (value: boolean) => void;
    run: Record<string, unknown> | null;
  };
  const navigate = vi.fn();
  const switchToDraft = vi.fn();
  const state: FakeBuilderState = {
    readonly: true,
    flow: { id: 'flow-1' },
    setReadOnly: () => undefined,
    run: null,
  };
  const captured: { onTakeOver?: () => void } = {};
  return { navigate, switchToDraft, state, captured };
});

vi.mock('@/hooks/use-resource-lock', () => ({
  useResourceLock: ({ onTakeOver }: { onTakeOver?: () => void }) => {
    harness.captured.onTakeOver = onTakeOver;
    return { lockedBy: null, takeOver: vi.fn() };
  },
}));

vi.mock('@/app/builder/builder-hooks', () => ({
  useBuilderStateContext: (
    selector: (state: typeof harness.state) => unknown,
  ) => selector(harness.state),
}));

vi.mock('@/app/builder/flow-canvas/hooks', () => ({
  flowCanvasHooks: {
    useSwitchToDraft: () => ({ switchToDraft: harness.switchToDraft }),
  },
}));

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useNavigate: () => harness.navigate,
}));

function Probe() {
  useFlowLock();
  return null;
}

describe('useFlowLock take-over branch', () => {
  let container: HTMLDivElement;
  let root: Root;
  const reloadSpy = vi.fn();
  const originalLocation = Object.getOwnPropertyDescriptor(window, 'location');

  beforeEach(() => {
    harness.navigate.mockClear();
    harness.switchToDraft.mockClear();
    harness.captured.onTakeOver = undefined;
    harness.state.run = null;
    reloadSpy.mockClear();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, reload: reloadSpy },
    });
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    if (originalLocation) {
      Object.defineProperty(window, 'location', originalLocation);
    }
  });

  it('navigates to the flow client-side when a run is being viewed', async () => {
    harness.state.run = { id: 'run-1' };
    await act(async () => {
      root.render(<Probe />);
    });

    expect(harness.captured.onTakeOver).toBeDefined();
    await act(async () => {
      harness.captured.onTakeOver?.();
    });

    expect(harness.navigate).toHaveBeenCalledTimes(1);
    expect(harness.navigate).toHaveBeenCalledWith(`/flows/${FLOW_ID}`);
    expect(harness.switchToDraft).not.toHaveBeenCalled();
    expect(reloadSpy).not.toHaveBeenCalled();
  });

  it('refreshes the draft in place when not viewing a run', async () => {
    harness.state.run = null;
    await act(async () => {
      root.render(<Probe />);
    });

    await act(async () => {
      harness.captured.onTakeOver?.();
    });

    expect(harness.switchToDraft).toHaveBeenCalledTimes(1);
    expect(harness.navigate).not.toHaveBeenCalled();
    expect(reloadSpy).not.toHaveBeenCalled();
  });
});
