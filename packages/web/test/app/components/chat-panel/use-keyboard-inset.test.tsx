// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useKeyboardInset } from '@/app/components/chat-panel/use-keyboard-inset';

class FakeViewport extends EventTarget {
  height = 800;
  offsetTop = 0;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useKeyboardInset', () => {
  it('lifts the sheet by the height the keyboard covers', () => {
    const viewport = new FakeViewport();
    vi.stubGlobal('visualViewport', viewport);
    vi.stubGlobal('innerHeight', 800);
    const { result } = renderHook(() => useKeyboardInset(true));

    act(() => {
      viewport.height = 500;
      viewport.dispatchEvent(new Event('resize'));
    });

    expect(result.current).toBe(300);
  });

  it('stays at zero while the sheet is closed', () => {
    const viewport = new FakeViewport();
    viewport.height = 500;
    vi.stubGlobal('visualViewport', viewport);
    vi.stubGlobal('innerHeight', 800);

    const { result } = renderHook(() => useKeyboardInset(false));

    expect(result.current).toBe(0);
  });
});
