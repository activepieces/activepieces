// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { pageContextUtils } from '@/features/chat/lib/page-context';

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
