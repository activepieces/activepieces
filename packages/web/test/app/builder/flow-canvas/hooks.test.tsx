/**
 * @vitest-environment jsdom
 */
/* eslint-disable testing-library/no-unnecessary-act */
import { act, useCallback, useRef, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';

import { flowCanvasHooks } from '@/app/builder/flow-canvas/hooks';

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement | null = null;
let root: Root | null = null;
let latestFlag = false;

describe('useIsFocusInsideListMapperModeInput', () => {
  afterEach(() => {
    act(() => root?.unmount());
    container?.remove();
    container = null;
    root = null;
    latestFlag = false;
  });

  it('turns list-mapper mode on inside the inline-items input and off in another field', () => {
    renderHarness({ showInlineItems: true });

    focusField('inline item');
    expect(latestFlag).toBe(true);

    focusField('other field');
    expect(latestFlag).toBe(false);
  });

  it('turns list-mapper mode off when the inline-items input unmounts without a focus change', () => {
    renderHarness({ showInlineItems: true });
    focusField('inline item');
    expect(latestFlag).toBe(true);

    renderHarness({ showInlineItems: false });

    expect(latestFlag).toBe(false);
  });
});

function InlineItemsInput({
  isFocusInsideListMapperModeInput,
  setIsFocusInsideListMapperModeInput,
}: {
  isFocusInsideListMapperModeInput: boolean;
  setIsFocusInsideListMapperModeInput: (value: boolean) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  flowCanvasHooks.useIsFocusInsideListMapperModeInput({
    containerRef,
    setIsFocusInsideListMapperModeInput,
    isFocusInsideListMapperModeInput,
  });
  return (
    <div ref={containerRef}>
      <input aria-label="inline item" />
    </div>
  );
}

function Harness({ showInlineItems }: { showInlineItems: boolean }) {
  const [flag, setFlag] = useState(false);
  const recordFlag = useCallback((value: boolean) => {
    latestFlag = value;
    setFlag(value);
  }, []);
  return (
    <div>
      {showInlineItems && (
        <InlineItemsInput
          isFocusInsideListMapperModeInput={flag}
          setIsFocusInsideListMapperModeInput={recordFlag}
        />
      )}
      <input aria-label="other field" />
    </div>
  );
}

function renderHarness({ showInlineItems }: { showInlineItems: boolean }) {
  if (!container) {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  }
  act(() => root?.render(<Harness showInlineItems={showInlineItems} />));
}

function focusField(label: string) {
  act(() => {
    container
      ?.querySelector<HTMLInputElement>(`[aria-label="${label}"]`)
      ?.focus();
  });
}
