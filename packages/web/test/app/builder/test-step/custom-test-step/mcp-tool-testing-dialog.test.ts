/**
 * @vitest-environment jsdom
 *
 * Regression test: toggling the dynamic (f(x)) input mode on the MCP tool
 * trigger's inputSchema property replaces its form value with `{}` (see
 * ARRAY case in form-utils.tsx's getDefaultPropertyValue). Reading that raw
 * value and calling .filter() on it without checking it's still an array
 * threw "TypeError: i.filter is not a function" in the test-trigger dialog.
 */
import { describe, expect, it } from 'vitest';

import { toMcpFormFields } from '@/app/builder/test-step/custom-test-step/mcp-tool-testing-dialog';

describe('toMcpFormFields', () => {
  it('returns the array unchanged when inputSchema is a valid array', () => {
    const fields = [{ name: 'foo', required: true, type: 'TEXT' }];
    expect(toMcpFormFields(fields)).toBe(fields);
  });

  it('falls back to an empty array when inputSchema is {} (dynamic mode toggled on)', () => {
    expect(toMcpFormFields({})).toEqual([]);
  });

  it('falls back to an empty array when inputSchema is null or undefined', () => {
    expect(toMcpFormFields(null)).toEqual([]);
    expect(toMcpFormFields(undefined)).toEqual([]);
  });
});
