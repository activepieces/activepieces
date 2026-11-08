import { describe, expect, it } from 'vitest';

import { chatStatusUtils } from '@/app/routes/chat-with-ai/components/chat-ui/chat-status-utils';

describe('chatStatusUtils', () => {
  it.each([
    ['running', 'working'],
    ['completed', 'done'],
    ['failed', 'failed'],
    ['stopped', 'stopped'],
  ] as const)('maps tool status %s to %s', (input, expected) => {
    expect(chatStatusUtils.fromToolStatus(input)).toBe(expected);
  });

  it.each([
    ['running', 'working'],
    ['done', 'done'],
    ['blocked', 'needs-you'],
    ['failed', 'stopped'],
  ] as const)('maps subagent status %s to %s', (input, expected) => {
    expect(chatStatusUtils.fromSubagent(input)).toBe(expected);
  });

  it.each([
    ['pending', null],
    ['in_progress', 'working'],
    ['done', 'done'],
    ['failed', 'failed'],
  ] as const)('maps build step %s to %s', (input, expected) => {
    expect(chatStatusUtils.fromBuildStep(input)).toBe(expected);
  });

  it.each([
    ['detecting', 'working'],
    ['building', 'working'],
    ['testing', 'working'],
    ['done', 'done'],
    ['failed', 'failed'],
  ] as const)('maps build phase %s to %s', (input, expected) => {
    expect(chatStatusUtils.fromBuildPhase(input)).toBe(expected);
  });

  it.each([
    [{ done: false, failed: 0 }, 'working'],
    [{ done: false, failed: 3 }, 'working'],
    [{ done: true, failed: 0 }, 'done'],
    [{ done: true, failed: 2 }, 'failed'],
  ] as const)('maps batch %o to %s', (progress, expected) => {
    expect(chatStatusUtils.fromBatch({ progress })).toBe(expected);
  });

  it.each([
    [{ done: false, failed: 0 }, true, 'stopped'],
    [{ done: false, failed: 0 }, false, 'working'],
    [{ done: true, failed: 1 }, true, 'failed'],
  ] as const)(
    'maps batch %o with ended=%s to %s',
    (progress, ended, expected) => {
      expect(chatStatusUtils.fromBatch({ progress, ended })).toBe(expected);
    },
  );

  it.each([
    ['success', 'done'],
    ['failed', 'failed'],
  ] as const)('maps receipt %s to %s', (input, expected) => {
    expect(chatStatusUtils.fromReceipt(input)).toBe(expected);
  });

  it.each([
    ['working', 'working'],
    ['waiting', 'needs-you'],
    ['unread', null],
  ] as const)('maps conversation indicator %s to %s', (input, expected) => {
    expect(chatStatusUtils.fromConversationIndicator(input)).toBe(expected);
  });
});
