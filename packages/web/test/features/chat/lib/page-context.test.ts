// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  pageContextUtils,
  useOpenBuilder,
} from '@/features/chat/lib/page-context';

vi.mock('@/lib/route-location', () => ({
  routeLocation: { pathname: () => '/projects/p1/flows/f1' },
}));

describe('pageContextUtils.fromPath', () => {
  it('names the flow and the selected step on a flow page', () => {
    expect(
      pageContextUtils.fromPath({
        pathname: '/projects/p1/flows/f1',
        builder: { flowId: 'f1', stepName: 'step_2' },
      }),
    ).toEqual({ kind: 'flow', id: 'f1', projectId: 'p1', stepName: 'step_2' });
  });

  it('names the table on a table page', () => {
    expect(
      pageContextUtils.fromPath({
        pathname: '/projects/p1/tables/t1',
        builder: null,
      }),
    ).toEqual({ kind: 'table', id: 't1', projectId: 'p1' });
  });

  it('sends nothing on a page that is not a flow or a table', () => {
    expect(
      pageContextUtils.fromPath({
        pathname: '/projects/p1/runs/r1',
        builder: { flowId: 'f1', stepName: 'step_2' },
      }),
    ).toBeNull();
  });
});

describe('pageContextUtils.current', () => {
  it('reads the selected step from the open builder store', () => {
    const state = { flow: { id: 'f1' }, selectedStep: 'step_1' };
    const store = { getState: () => state };
    const { unmount } = renderHook(() => useOpenBuilder(store));

    state.selectedStep = 'step_3';

    expect(pageContextUtils.current()).toEqual({
      kind: 'flow',
      id: 'f1',
      projectId: 'p1',
      stepName: 'step_3',
    });
    unmount();
    expect(pageContextUtils.current()).toEqual({
      kind: 'flow',
      id: 'f1',
      projectId: 'p1',
    });
  });
});
