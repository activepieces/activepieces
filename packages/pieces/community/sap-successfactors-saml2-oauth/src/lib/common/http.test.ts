import { describe, expect, it } from 'vitest';
import { successFactorsHttp } from './http';

describe('successFactorsHttp', () => {
  describe('normalizeBaseUrl', () => {
    it('accepts an HTTPS origin', () => {
      expect(
        successFactorsHttp.normalizeBaseUrl({
          value: '  https://api.example.com  ',
          fieldName: 'API URL',
        }),
      ).toBe('https://api.example.com');
    });

    it.each([
      'http://api.example.com',
      'https://api.example.com/odata/v2',
      'https://api.example.com?query=value',
      'https://api.example.com#fragment',
      'https://user:password@api.example.com',
    ])('rejects invalid base URL %s', (value) => {
      expect(() =>
        successFactorsHttp.normalizeBaseUrl({
          value,
          fieldName: 'API URL',
        }),
      ).toThrow();
    });
  });

  describe('assertCustomApiRelativePath', () => {
    it.each([
      "/User('123')",
      "User('123')",
      '/PerPerson?$top=10',
      "/EmpEmployment?$filter=userId%20eq%20'123'",
    ])('accepts relative OData path %s', (value) => {
      expect(() =>
        successFactorsHttp.assertCustomApiRelativePath(value),
      ).not.toThrow();
    });

    it.each([
      'https://evil.example.com/odata/v2/User',
      'http://evil.example.com/odata/v2/User',
      '//evil.example.com/odata/v2/User',
      '\\evil.example.com\\odata\\v2\\User',
      '../oauth/token',
      '/%2e%2e/oauth/token',
      '/foo/%2E%2E/oauth/token',
    ])('rejects unsafe custom API URL %s', (value) => {
      expect(() =>
        successFactorsHttp.assertCustomApiRelativePath(value),
      ).toThrow();
    });
  });

  describe('encodeODataKey', () => {
    it('escapes apostrophes and URL-reserved characters', () => {
      expect(successFactorsHttp.encodeODataKey("o'brien/a+b")).toBe(
        "o''brien%2Fa%2Bb",
      );
    });

    it('encodes email-style user IDs', () => {
      expect(successFactorsHttp.encodeODataKey('john@example.com')).toBe(
        'john%40example.com',
      );
    });

    it('rejects an empty user ID', () => {
      expect(() => successFactorsHttp.encodeODataKey('   ')).toThrow(
        'User ID is required.',
      );
    });
  });
});
