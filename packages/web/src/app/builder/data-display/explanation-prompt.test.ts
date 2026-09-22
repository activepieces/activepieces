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

describe('explanationPromptUtils.build - url secrets', () => {
  it('redacts a secret query param in a non-secret step property', () => {
    const prompt = build(buildError(), [
      {
        name: 'url',
        displayName: 'URL',
        type: 'SHORT_TEXT',
        currentValue: 'https://example.com/api?api_key=SECRET',
      },
    ]);

    expect(prompt).not.toContain('SECRET');
    expect(prompt).toContain('api_key=%5BREDACTED%5D');
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
    const prompt = build(buildError(), [
      {
        name: 'url',
        type: 'SHORT_TEXT',
        currentValue: 'https://SECRET_USER:SECRET_PASS@example.com/api',
      },
    ]);

    expect(prompt).not.toContain('SECRET_USER');
    expect(prompt).not.toContain('SECRET_PASS');
    expect(prompt).toContain('example.com');
  });

  it('redacts a token carried as the whole url userinfo', () => {
    const prompt = build(buildError(), [
      {
        name: 'url',
        type: 'SHORT_TEXT',
        currentValue: 'https://SECRET@api.example.com/v1/charges',
      },
    ]);

    expect(prompt).not.toContain('SECRET');
  });

  it('redacts a secret param in a url whose query contains spaces or quotes', () => {
    const prompt = build(
      buildError({
        requestUrl:
          "https://example.com/odata?$filter=name eq 'Acme'&api_key=SECRET",
      }),
      [
        {
          name: 'url',
          type: 'SHORT_TEXT',
          currentValue:
            'https://example.com/search?q=hello world&api_key=SECRET',
        },
      ],
    );

    expect(prompt).not.toContain('SECRET');
  });

  it('redacts a secret carried in the url fragment', () => {
    const prompt = build(buildError(), [
      {
        name: 'url',
        type: 'SHORT_TEXT',
        currentValue: 'https://example.com/callback#access_token=SECRET',
      },
    ]);

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
    expect(prompt).toContain('api_key=%5BREDACTED%5D) for details');
  });

  it('leaves strings without url secrets byte-identical', () => {
    const untouched = [
      'https://alpha.example.com',
      'https://beta.example.com/api?page=2',
      'https://gamma.example.com/orders/{{step_1.id}}',
      'https://delta.example.com/docs#section-1',
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
