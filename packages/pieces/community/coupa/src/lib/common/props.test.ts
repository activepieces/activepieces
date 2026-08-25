import { describe, expect, it } from 'vitest';
import {
  parseOptionalQuery,
  resolveModuleResource,
  toCoupaModule,
} from './props';

describe('resolveModuleResource', () => {
  it('returns the module name for standard modules', () => {
    expect(resolveModuleResource('purchase_orders', undefined)).toBe('purchase_orders');
  });

  it('uses and trims the custom resource path for __custom__', () => {
    expect(resolveModuleResource('__custom__', '/invoices/')).toBe('invoices');
    expect(resolveModuleResource('__custom__', '  approvals ')).toBe('approvals');
  });

  it('throws when custom resource path is missing', () => {
    expect(() => resolveModuleResource('__custom__', '')).toThrow(
      'Custom Resource Path is required'
    );
    expect(() => resolveModuleResource('__custom__', undefined)).toThrow();
  });

  it('throws when module is missing', () => {
    expect(() => resolveModuleResource(undefined, undefined)).toThrow('Module is required');
  });
});

describe('toCoupaModule', () => {
  it('accepts the three standard modules', () => {
    expect(toCoupaModule('purchase_orders')).toBe('purchase_orders');
    expect(toCoupaModule('suppliers')).toBe('suppliers');
    expect(toCoupaModule('contracts')).toBe('contracts');
  });

  it('throws for unsupported modules', () => {
    expect(() => toCoupaModule('__custom__')).toThrow();
    expect(() => toCoupaModule('invoices')).toThrow();
  });
});

describe('parseOptionalQuery', () => {
  it('returns {} for empty input', () => {
    expect(parseOptionalQuery(undefined)).toEqual({});
    expect(parseOptionalQuery(null)).toEqual({});
    expect(parseOptionalQuery('')).toEqual({});
  });

  it('accepts an object and drops null/undefined values', () => {
    expect(
      parseOptionalQuery({ 'status[in]': 'issued', exported: false, skip: null })
    ).toEqual({ 'status[in]': 'issued', exported: false });
  });

  it('parses a JSON string', () => {
    expect(parseOptionalQuery('{"limit":10}')).toEqual({ limit: 10 });
  });
});
