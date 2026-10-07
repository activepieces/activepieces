/**
 * @vitest-environment jsdom
 */
/* eslint-disable testing-library/no-unnecessary-act */
import { FlowAction, FlowActionType } from '@activepieces/shared';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import StepDragOverlay from '@/app/builder/flow-canvas/nodes/step-node/step-drag-overlay';

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const canvasOrigin = vi.hoisted(() => ({ left: 255, top: 68 }));

vi.mock('@xyflow/react', () => ({
  useStore: <T,>(selector: (state: CanvasState) => T) =>
    selector({ domNode: { getBoundingClientRect: () => canvasOrigin } }),
}));

vi.mock('@/features/pieces', () => ({
  stepsHooks: { useStepMetadata: () => ({ stepMetadata: undefined }) },
}));

vi.mock('@/app/builder/flow-canvas/utils/consts', () => ({
  flowCanvasConsts: {
    STEP_DRAG_OVERLAY_WIDTH: 75,
    STEP_DRAG_OVERLAY_HEIGHT: 75,
  },
}));

vi.mock('i18next', () => ({ t: (key: string) => key }));

let container: HTMLDivElement | null = null;
let root: Root | null = null;

describe('StepDragOverlay', () => {
  afterEach(() => {
    act(() => root?.unmount());
    container?.remove();
    container = null;
    root = null;
  });

  it('centres the step preview on the cursor, measured from the canvas element', () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => root?.render(<StepDragOverlay step={buildCodeStep()} />));

    act(() => {
      window.dispatchEvent(
        new MouseEvent('pointermove', { clientX: 509, clientY: 591 }),
      );
    });

    const overlay = container.querySelector<HTMLElement>(
      '#dragged-step-overlay',
    );
    expect(overlay?.style.left).toBe(`${509 - 75 / 2 - canvasOrigin.left}px`);
    expect(overlay?.style.top).toBe(`${591 - 75 / 2 - canvasOrigin.top}px`);
  });
});

function buildCodeStep(): FlowAction {
  return {
    name: 'step_1',
    valid: true,
    displayName: 'Step 1',
    skip: false,
    lastUpdatedDate: '2026-09-24T00:00:00.000Z',
    type: FlowActionType.CODE,
    settings: {
      sourceCode: { code: '', packageJson: '{}' },
      input: {},
      errorHandlingOptions: {
        continueOnFailure: { value: false },
        retryOnFailure: { value: false },
      },
    },
  };
}

type CanvasState = {
  domNode: { getBoundingClientRect: () => { left: number; top: number } };
};
