import { describe, expect, test } from 'vitest';
import { microsoft365CopilotAuth } from '../src/lib/common/auth';
import { deduplicateRepeatedReplyText } from '../src/lib/actions/chat-with-copilot';

describe('microsoft365CopilotAuth', () => {
  test('requests offline_access so Microsoft issues a refresh token', () => {
    expect(microsoft365CopilotAuth.scope).toContain('offline_access');
  });
});

describe('deduplicateRepeatedReplyText', () => {
  test('collapses exact duplicated reply text from Microsoft Graph Copilot API', () => {
    expect(deduplicateRepeatedReplyText('HELLOHELLO')).toBe('HELLO');
    expect(deduplicateRepeatedReplyText('{"ok":true}{"ok":true}')).toBe('{"ok":true}');
  });

  test('preserves non-duplicated or odd-length reply text', () => {
    expect(deduplicateRepeatedReplyText('HELLO')).toBe('HELLO');
    expect(deduplicateRepeatedReplyText('HELLO WORLD')).toBe('HELLO WORLD');
    expect(deduplicateRepeatedReplyText('')).toBe('');
  });
});
