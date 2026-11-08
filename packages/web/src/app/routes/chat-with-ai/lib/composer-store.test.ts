import { describe, expect, it } from 'vitest';

import { composerStore } from './composer-store';

describe('composerStore', () => {
  it('hands a fill to the matching composer once', () => {
    composerStore.fill({ key: 'new:chat', text: 'Build a flow' });
    expect(composerStore.take('other')).toBeNull();
    expect(composerStore.take('new:chat')).toEqual({
      text: 'Build a flow',
      files: [],
      mode: 'replace',
    });
    expect(composerStore.take('new:chat')).toBeNull();
  });

  it('keeps the latest fill per composer', () => {
    composerStore.fill({ key: 'a', text: 'first' });
    composerStore.fill({ key: 'a', text: 'second', mode: 'restore' });
    composerStore.fill({ key: 'b', text: 'other' });
    expect(composerStore.take('a')).toMatchObject({
      text: 'second',
      mode: 'restore',
    });
    expect(composerStore.take('b')).toMatchObject({ text: 'other' });
  });
});
