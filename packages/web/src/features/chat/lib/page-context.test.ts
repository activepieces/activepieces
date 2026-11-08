import { describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: { getProjectId: () => 'current-project' },
}));

import { pageContextUtils } from './page-context';

describe('pageContextUtils.fromPath', () => {
  it('sends the resource on screen with its selection', () => {
    expect(
      pageContextUtils.fromPath({
        pathname: '/projects/p1/flows/f1',
        selection: { stepName: 'step_2' },
      }),
    ).toEqual({
      kind: 'flow',
      id: 'f1',
      projectId: 'p1',
      selection: { stepName: 'step_2' },
    });
  });

  it('falls back to a plain page inside a project', () => {
    expect(
      pageContextUtils.fromPath({
        pathname: '/projects/p1/automations',
        selection: { recordIds: ['r1'] },
      }),
    ).toEqual({ kind: 'page', projectId: 'p1' });
  });

  it('sends nothing for the chat page itself', () => {
    expect(
      pageContextUtils.fromPath({ pathname: '/chat/abc', selection: null }),
    ).toBeNull();
  });
});
