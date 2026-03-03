import { describe, it, expect } from 'vitest';
import { ChatType } from './types';

describe('types.ts — ChatType enum', () => {
  it('ChatType.CONTACT equals "contact"', () => {
    expect(ChatType.CONTACT).toBe('contact');
  });

  it('ChatType.GROUP equals "group"', () => {
    expect(ChatType.GROUP).toBe('group');
  });
});
