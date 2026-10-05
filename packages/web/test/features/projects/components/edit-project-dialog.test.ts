/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({ t: (key: string) => key }));

import { editProjectRequest } from '@/features/projects/components/edit-project-dialog';

const values = {
  displayName: '  Support ',
  externalId: 'org-1',
  sensitive: false,
  globalConnectionExternalIds: [],
};

describe('editProjectRequest', () => {
  it('leaves global connections untouched when they failed to load', () => {
    const request = editProjectRequest({
      values,
      connectionsStatus: 'failed',
      connectionsDirty: true,
    });

    expect(request.globalConnectionExternalIds).toBeUndefined();
    expect(request.displayName).toBe('Support');
  });

  it('leaves global connections untouched when the picker was not changed', () => {
    const request = editProjectRequest({
      values: { ...values, globalConnectionExternalIds: ['slack'] },
      connectionsStatus: 'ready',
      connectionsDirty: false,
    });

    expect(request.globalConnectionExternalIds).toBeUndefined();
  });

  it('sends the picked connections, even an empty list, once they were changed', () => {
    const request = editProjectRequest({
      values,
      connectionsStatus: 'ready',
      connectionsDirty: true,
    });

    expect(request.globalConnectionExternalIds).toEqual([]);
  });
});
