/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useFollowAlong } from '@/features/chat/lib/follow/follow-along';
import { useRowSheen } from '@/features/tables/hooks/use-row-sheen';

describe('useRowSheen', () => {
  beforeEach(() => {
    useFollowAlong.setState({ phase: 'editing', flashes: {} });
  });

  it('drops a row highlight that was not shown before the run ended', () => {
    useFollowAlong.setState({ flashes: { 'table-row:u1': 1 } });
    const { result } = renderHook(() => useRowSheen([{ uuid: 'u1' }]));
    expect(result.current.pendingToken('u1')).toBe(1);

    act(() => useFollowAlong.setState({ phase: 'idle' }));

    expect(result.current.pendingToken('u1')).toBeNull();
    expect(result.current.firstRow).toBeNull();
  });

  it('plays each highlight once', () => {
    useFollowAlong.setState({ flashes: { 'table-row:u1': 1 } });
    const { result } = renderHook(() => useRowSheen([{ uuid: 'u1' }]));

    act(() => result.current.played({ rowId: 'u1', token: 1 }));

    expect(result.current.pendingToken('u1')).toBeNull();
    act(() => useFollowAlong.setState({ flashes: { 'table-row:u1': 2 } }));
    expect(result.current.pendingToken('u1')).toBe(2);
  });
});
