import { describe, expect, it } from 'vitest';
import { backblazeAiCommon } from '../src/lib/actions/ai/ai-common';

describe('toActionError', () => {
  it('distinguishes missing key from missing bucket', () => {
    const key = backblazeAiCommon.toActionError({
      error: { name: 'NoSuchKey', message: 'x', $metadata: { httpStatusCode: 404 } },
      operation: 'read file',
      key: 'a.txt',
    });
    const bucket = backblazeAiCommon.toActionError({
      error: { name: 'NoSuchBucket', message: 'y', $metadata: { httpStatusCode: 404 } },
      operation: 'read file',
      key: 'a.txt',
    });
    expect(key.message).toContain('does not exist');
    expect(bucket.message).toContain('bucket was not found');
  });
  it('keeps the SDK name and message for other errors', () => {
    const error = backblazeAiCommon.toActionError({
      error: { name: 'SlowDown', message: 'busy', $metadata: { httpStatusCode: 503 } },
      operation: 'list files',
    });
    expect(error.message).toBe('Backblaze list files failed (SlowDown: busy).');
  });
});

describe('helpers', () => {
  it('detects text content types', () => {
    expect(backblazeAiCommon.isTextContentType('application/json')).toBe(true);
    expect(backblazeAiCommon.isTextContentType('image/png')).toBe(false);
  });
  it('encodes copy sources per segment', () => {
    expect(backblazeAiCommon.copySource({ bucket: 'b', key: 'a dir/x+y.txt' })).toBe('b/a%20dir/x%2By.txt');
  });
});
