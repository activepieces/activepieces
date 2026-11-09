import { describe, expect, it } from 'vitest';

import { composerStore } from '@/app/routes/chat-with-ai/lib/composer-store';

describe('composerStore', () => {
  it('hands a fill to the matching composer once', () => {
    composerStore.fill({ key: 'new:chat', text: 'Build a flow', files: [] });
    expect(composerStore.take('other')).toBeNull();
    expect(composerStore.take('new:chat')).toEqual({
      text: 'Build a flow',
      files: [],
    });
    expect(composerStore.take('new:chat')).toBeNull();
  });

  it('joins fills that wait for the same composer', () => {
    const file = new File(['a'], 'a.txt');
    composerStore.fill({ key: 'a', text: 'first', files: [file] });
    composerStore.fill({ key: 'a', text: 'second', files: [] });
    composerStore.fill({ key: 'b', text: 'other', files: [] });
    expect(composerStore.take('a')).toEqual({
      text: 'first\n\nsecond',
      files: [file],
    });
    expect(composerStore.take('b')).toMatchObject({ text: 'other' });
  });
});
