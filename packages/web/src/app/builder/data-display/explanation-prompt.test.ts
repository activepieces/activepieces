import { FriendlyPieceError } from '@activepieces/core-utils';
import { describe, it, expect } from 'vitest';

import {
  ErrorExplanationContext,
  explanationPromptUtils,
  StepPropertySnapshot,
} from './explanation-prompt';

const buildError = (
  overrides: Partial<FriendlyPieceError> = {},
): FriendlyPieceError => ({
  __apErrorVersion: 1,
  message: 'Request failed with status code 401',
  ...overrides,
});

const buildContext = (
  properties: StepPropertySnapshot[],
): ErrorExplanationContext => ({
  stepKind: 'action',
  stepName: 'send_http_request',
  stepDisplayName: 'Send HTTP request',
  stepProperties: properties,
});

const build = (
  error: FriendlyPieceError,
  properties: StepPropertySnapshot[] = [],
) => explanationPromptUtils.build({ error, context: buildContext(properties) });

const buildWithUrl = (url: string) =>
  build(buildError(), [
    { name: 'url', displayName: 'URL', type: 'SHORT_TEXT', currentValue: url },
  ]);

const nest = (depth: number, leaf: unknown): unknown =>
  depth === 0 ? leaf : { next: nest(depth - 1, leaf) };

describe('explanationPromptUtils.build - url secrets', () => {
  it('redacts a secret query param in a non-secret step property', () => {
    const prompt = buildWithUrl('https://example.com/api?api_key=SECRET');

    expect(prompt).not.toContain('SECRET');
    expect(prompt).toContain('api_key=[REDACTED]');
  });

  it('redacts a secret query param in a step property default value', () => {
    const prompt = build(buildError(), [
      {
        name: 'endpoint',
        type: 'SHORT_TEXT',
        defaultValue: 'https://example.com/api?token=SECRET',
      },
    ]);

    expect(prompt).not.toContain('SECRET');
  });

  it('redacts secrets in urls nested inside object and array property values', () => {
    const prompt = build(buildError(), [
      {
        name: 'headers',
        type: 'OBJECT',
        currentValue: {
          callback: 'https://example.com/hook?access_token=SECRET',
          extras: ['https://example.com/a?client_secret=SECRET'],
        },
      },
    ]);

    expect(prompt).not.toContain('SECRET');
  });

  it('redacts both halves of the url userinfo', () => {
    const prompt = buildWithUrl(
      'https://SECRET_USER:SECRET_PASS@example.com/api',
    );

    expect(prompt).not.toContain('SECRET_USER');
    expect(prompt).not.toContain('SECRET_PASS');
    expect(prompt).toContain('example.com');
  });

  it('redacts a token carried as the whole url userinfo', () => {
    const prompt = buildWithUrl('https://SECRET@api.example.com/v1/charges');

    expect(prompt).not.toContain('SECRET');
  });

  it('redacts a secret carried in the url fragment', () => {
    const prompt = buildWithUrl(
      'https://example.com/callback#access_token=SECRET',
    );

    expect(prompt).not.toContain('SECRET');
  });

  it('redacts a secret param in a url whose query holds spaces and quotes', () => {
    const prompt = buildWithUrl(
      "https://example.com/odata?$filter=name eq 'Acme'&api_key=SECRET",
    );

    expect(prompt).not.toContain('SECRET');
  });

  it('redacts a secret param in a url embedded in free text after a space', () => {
    const prompt = build(
      buildError({
        message:
          "request to https://example.com/odata?$filter=name eq 'Acme'&api_key=SECRET failed",
      }),
    );

    expect(prompt).not.toContain('SECRET');
  });

  it('redacts secret params in relative and protocol-relative urls', () => {
    const prompt = build(buildError(), [
      { name: 'path', type: 'SHORT_TEXT', currentValue: '/api?token=SECRET' },
      {
        name: 'other',
        type: 'SHORT_TEXT',
        currentValue: '//example.com/api?api_key=SECRET',
      },
    ]);

    expect(prompt).not.toContain('SECRET');
  });

  it('redacts a secret in a payload nested deeper than the object walk', () => {
    const prompt = build(
      buildError({
        responseBody: nest(12, {
          docs: 'https://example.com/d?api_key=SECRET',
        }),
      }),
    );

    expect(prompt).not.toContain('SECRET');
  });

  it('redacts a url embedded in the error message', () => {
    const prompt = build(
      buildError({
        message:
          'request to https://example.com/api?api_key=SECRET failed, reason: ECONNRESET',
      }),
    );

    expect(prompt).not.toContain('SECRET');
  });

  it('redacts a url embedded in the api message', () => {
    const prompt = build(
      buildError({ apiMessage: 'callback https://example.com?token=SECRET' }),
    );

    expect(prompt).not.toContain('SECRET');
  });

  it('redacts secrets in urls nested inside the response body', () => {
    const prompt = build(
      buildError({
        responseBody: { docs: 'https://example.com/docs?api_key=SECRET' },
      }),
    );

    expect(prompt).not.toContain('SECRET');
  });

  it('keeps redacting the request url', () => {
    const prompt = build(
      buildError({ requestUrl: 'https://example.com/api?api_key=SECRET' }),
    );

    expect(prompt).not.toContain('SECRET');
  });

  it('keeps text around a redacted url intact', () => {
    const prompt = build(
      buildError({
        message: 'see [docs](https://example.com/d?api_key=SECRET) for details',
      }),
    );

    expect(prompt).not.toContain('SECRET');
    expect(prompt).toContain('api_key=[REDACTED]) for details');
  });

  it('leaves strings without url secrets byte-identical', () => {
    const untouched = [
      'https://alpha.example.com',
      'https://beta.example.com/api?page=2',
      'https://gamma.example.com/orders/{{step_1.id}}',
      'https://delta.example.com/docs#section-1',
      'https://epsilon.example.com/search?q=hello world',
      'not a url at all',
      'mailto:support@example.com',
    ];
    const prompt = build(
      buildError(),
      untouched.map((value, index) => ({
        name: `prop_${index}`,
        type: 'SHORT_TEXT',
        currentValue: value,
      })),
    );

    for (const value of untouched) {
      expect(prompt).toContain(`current=${value}\n`);
    }
  });
});
