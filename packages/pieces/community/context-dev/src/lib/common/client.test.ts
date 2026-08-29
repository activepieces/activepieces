import { describe, expect, it } from 'vitest';

import { flattenRecord, toQueryParams, toStringArray } from './client';

describe('Context.dev client helpers', () => {
  it('serializes defined query parameters only', () => {
    expect(
      toQueryParams({
        url: 'https://context.dev',
        includeLinks: false,
        timeoutMS: 30000,
        country: undefined,
      })
    ).toEqual({
      url: 'https://context.dev',
      includeLinks: 'false',
      timeoutMS: '30000',
    });
  });

  it('keeps only non-empty string array values', () => {
    expect(toStringArray(['context.dev', '', 42, null, 'github.com'])).toEqual([
      'context.dev',
      'github.com',
    ]);
    expect(toStringArray('context.dev')).toEqual([]);
  });

  it('flattens nested response data into workflow-safe fields', () => {
    expect(
      flattenRecord({
        status: 'ok',
        brand: {
          title: 'Context.dev',
          address: { city: 'San Francisco' },
          colors: [{ hex: '#2563EB' }, { hex: '#FFFFFF' }],
          description: null,
        },
      })
    ).toEqual({
      status: 'ok',
      brand_title: 'Context.dev',
      brand_address_city: 'San Francisco',
      brand_colors: '{"hex":"#2563EB"}, {"hex":"#FFFFFF"}',
      brand_description: null,
    });
  });
});
