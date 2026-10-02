/**
 * @vitest-environment jsdom
 */
/* eslint-disable testing-library/no-unnecessary-act */
import { act, useCallback, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';

import { flowCanvasHooks } from '@/app/builder/flow-canvas/hooks';
import { textMentionUtils } from '@/app/builder/piece-properties/text-input-with-mentions/text-input-utils';

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

  it('turns list-mapper mode on inside an inline-items input and off in another field', () => {
    renderHarness({ inlineItems: ['inline item'] });

    focusField('inline item');
    expect(latestFlag).toBe(true);

    focusField('other field');
    expect(latestFlag).toBe(false);
  });

  it('turns list-mapper mode off when the focused inline-items input unmounts without a focus change', () => {
    renderHarness({ inlineItems: ['inline item'] });
    focusField('inline item');
    expect(latestFlag).toBe(true);

    renderHarness({ inlineItems: [] });

    expect(latestFlag).toBe(false);
  });

  it('turns list-mapper mode on for whichever of two inline-items inputs is focused', () => {
    renderHarness({ inlineItems: ['first array', 'second array'] });

    focusField('first array');
    expect(latestFlag).toBe(true);

    focusField('second array');
    expect(latestFlag).toBe(true);
  });

  it('keeps list-mapper mode on when another inline-items input unmounts while one is focused', () => {
    renderHarness({ inlineItems: ['first array', 'second array'] });
    focusField('second array');
    expect(latestFlag).toBe(true);

    renderHarness({ inlineItems: ['second array'] });

    expect(latestFlag).toBe(true);
  });
});

function InlineItemsInput({
  label,
  isFocusInsideListMapperModeInput,
  setIsFocusInsideListMapperModeInput,
}: {
  label: string;
  isFocusInsideListMapperModeInput: boolean;
  setIsFocusInsideListMapperModeInput: (value: boolean) => void;
}) {
  flowCanvasHooks.useIsFocusInsideListMapperModeInput({
    setIsFocusInsideListMapperModeInput,
    isFocusInsideListMapperModeInput,
  });
  return (
    <div className={textMentionUtils.listMapperModeInputCssClass}>
      <input aria-label={label} />
    </div>
  );
}

function Harness({ inlineItems }: { inlineItems: string[] }) {
  const [flag, setFlag] = useState(false);
  const recordFlag = useCallback((value: boolean) => {
    latestFlag = value;
    setFlag(value);
  }, []);
  return (
    <div>
      {inlineItems.map((label) => (
        <InlineItemsInput
          key={label}
          label={label}
          isFocusInsideListMapperModeInput={flag}
          setIsFocusInsideListMapperModeInput={recordFlag}
        />
      ))}
      <input aria-label="other field" />
    </div>
  );
}

function renderHarness({ inlineItems }: { inlineItems: string[] }) {
  if (!container) {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  }
  act(() => root?.render(<Harness inlineItems={inlineItems} />));
}

function focusField(label: string) {
  act(() => {
    container
      ?.querySelector<HTMLInputElement>(`[aria-label="${label}"]`)
      ?.focus();
  });
}
