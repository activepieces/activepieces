// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useStableCallback } from '@/hooks/use-stable-callback';

describe('useStableCallback', () => {
  it('keeps the same identity across renders', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useStableCallback(() => value),
      { initialProps: { value: 1 } },
    );
    const first = result.current;
    rerender({ value: 2 });
    expect(result.current).toBe(first);
  });

  it('always calls the latest callback', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useStableCallback((add: number) => value + add),
      { initialProps: { value: 1 } },
    );
    expect(result.current(10)).toBe(11);
    rerender({ value: 5 });
    expect(result.current(10)).toBe(15);
  });
});
