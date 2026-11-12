// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { windowSizeHooks } from '@/features/workspace/lib/window-size-hooks';

describe('windowSizeHooks.useIsPhone', () => {
  it('re-renders only when the window crosses the phone breakpoint', () => {
    resizeTo(1280);
    let renders = 0;
    const { result } = renderHook(() => {
      renders += 1;
      return windowSizeHooks.useIsPhone();
    });
    expect(result.current).toBe(false);

    resizeTo(1200);
    resizeTo(1000);
    expect(renders).toBe(1);

    resizeTo(390);
    expect(result.current).toBe(true);
    expect(renders).toBe(2);
  });
});

function resizeTo(width: number): void {
  act(() => {
    window.innerWidth = width;
    window.dispatchEvent(new Event('resize'));
  });
}
