import { describe, expect, it } from 'vitest';

import {
  REDACTED_DISPLAY_VALUE,
  sensitiveOutputUtils,
} from '@/components/custom/smart-output-viewer/redact-sensitive';

const schema = {
  fields: [
    { key: 'ARN', label: 'ARN' },
    { key: 'apiKey', label: 'API Key', sensitive: true },
  ],
};

describe('sensitiveOutputUtils.redactSensitiveOutput', () => {
  it('masks only sensitive top-level keys on an object', () => {
    expect(
      sensitiveOutputUtils.redactSensitiveOutput(
        { ARN: 'arn:1', apiKey: 'super-secret' },
        schema,
      ),
    ).toEqual({ ARN: 'arn:1', apiKey: REDACTED_DISPLAY_VALUE });
  });

  it('masks sensitive keys on each item of an array', () => {
    expect(
      sensitiveOutputUtils.redactSensitiveOutput(
        [{ apiKey: 'a' }, { apiKey: 'b' }],
        schema,
      ),
    ).toEqual([
      { apiKey: REDACTED_DISPLAY_VALUE },
      { apiKey: REDACTED_DISPLAY_VALUE },
    ]);
  });

  it('is a no-op without a schema or sensitive fields', () => {
    const value = { apiKey: 'super-secret' };
    expect(sensitiveOutputUtils.redactSensitiveOutput(value, null)).toBe(value);
    expect(
      sensitiveOutputUtils.redactSensitiveOutput(value, {
        fields: [{ key: 'apiKey', label: 'API Key' }],
      }),
    ).toBe(value);
  });

  it('does not mutate the input', () => {
    const value = { apiKey: 'super-secret' };
    sensitiveOutputUtils.redactSensitiveOutput(value, schema);
    expect(value.apiKey).toBe('super-secret');
  });
});
