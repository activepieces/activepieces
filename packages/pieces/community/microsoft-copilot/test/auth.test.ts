import { describe, expect, test } from 'vitest';
import { microsoft365CopilotAuth } from '../src/lib/common/auth';

describe('microsoft365CopilotAuth', () => {
  test('requests offline_access so Microsoft issues a refresh token', () => {
    expect(microsoft365CopilotAuth.scope).toContain('offline_access');
  });
});
