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
        builder: { flowId: 'f1', label: 'Lead intake', stepName: 'step_2' },
      }),
    ).toEqual({
      kind: 'flow',
      id: 'f1',
      projectId: 'p1',
      label: 'Lead intake',
      stepName: 'step_2',
    });
  });

  it('cuts a long flow name and step name to what the server accepts', () => {
    const context = pageContextUtils.fromPath({
      pathname: '/projects/p1/flows/f1',
      builder: {
        flowId: 'f1',
        label: 'L'.repeat(250),
        stepName: 's'.repeat(150),
      },
    });

    expect(context?.label).toHaveLength(200);
    expect(context?.stepName).toHaveLength(128);
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
        builder: { flowId: 'f1', label: 'Lead intake', stepName: 'step_2' },
      }),
    ).toBeNull();
  });
});

describe('pageContextUtils.current', () => {
  it('reads the flow name and selected step from the open builder store', () => {
    const state = {
      flow: { id: 'f1' },
      flowVersion: { displayName: 'Lead intake' },
      selectedStep: 'step_1',
    };
    const store = { getState: () => state };
    const { unmount } = renderHook(() => useOpenBuilder(store));

    state.flowVersion = { displayName: 'Lead routing' };
    state.selectedStep = 'step_3';

    expect(pageContextUtils.current()).toEqual({
      kind: 'flow',
      id: 'f1',
      projectId: 'p1',
      label: 'Lead routing',
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
