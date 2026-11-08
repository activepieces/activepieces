// @vitest-environment jsdom
import { AIProviderName } from '@activepieces/core-utils';
import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { AppConnectionType } from '@activepieces/shared';
import i18next from 'i18next';
import { beforeAll, describe, expect, it } from 'vitest';

import {
  ExistingProviderKey,
  SecretField,
  SecretRequest,
  secretRequestUtils,
} from './secret-request';

beforeAll(async () => {
  await i18next.init({
    lng: 'en',
    resources: {},
    interpolation: { escapeValue: false },
  });
});

describe('secretRequestUtils.parse', () => {
  it('rejects non-objects and unknown targets', () => {
    expect(secretRequestUtils.parse(null)).toBeNull();
    expect(secretRequestUtils.parse('connection')).toBeNull();
    expect(secretRequestUtils.parse([])).toBeNull();
    expect(secretRequestUtils.parse({ target: 'database' })).toBeNull();
    expect(secretRequestUtils.parse({ fields: [] })).toBeNull();
  });

  it('keeps only well-formed fields', () => {
    const request = secretRequestUtils.parse({
      target: 'connection',
      piece: '@activepieces/piece-google-sheets',
      fields: [
        { name: 'api_key', label: 'API key', type: 'text', hint: 'Find it' },
        { name: '' },
        { label: 'no name' },
        'api_key',
        null,
        { name: 'token', type: 'script' },
      ],
    });
    expect(request?.fields).toEqual([
      { name: 'api_key', label: 'API key', type: 'text', hint: 'Find it' },
      { name: 'token', label: 'token', type: 'password', hint: null },
    ]);
    expect(request?.name).toBe('Google Sheets');
  });

  it('ignores non-string values and falls back on names', () => {
    const request = secretRequestUtils.parse({
      target: 'secret_manager',
      piece: 42,
      provider: { name: 'openai' },
      title: ['x'],
      reason: '',
      fields: 'api_key',
    });
    expect(request).toMatchObject({
      target: 'secret_manager',
      piece: null,
      provider: null,
      reason: null,
      fields: [],
    });
    expect(request?.title).toContain('key');
  });
});

describe('secretRequestUtils.isExpired', () => {
  it('only accepts an explicit timedOut flag', () => {
    expect(secretRequestUtils.isExpired({ timedOut: true })).toBe(true);
    expect(secretRequestUtils.isExpired({ timedOut: 'true' })).toBe(false);
    expect(secretRequestUtils.isExpired({})).toBe(false);
    expect(secretRequestUtils.isExpired(null)).toBe(false);
    expect(secretRequestUtils.isExpired('timedOut')).toBe(false);
  });
});

describe('secretRequestUtils.canSaveInline', () => {
  it('needs fields and a supported target', () => {
    expect(
      secretRequestUtils.canSaveInline(
        request({ target: 'ai_provider', provider: AIProviderName.OPENAI }),
      ),
    ).toBe(true);
    expect(
      secretRequestUtils.canSaveInline(
        request({
          target: 'ai_provider',
          provider: AIProviderName.OPENAI,
          fields: [],
        }),
      ),
    ).toBe(false);
    expect(
      secretRequestUtils.canSaveInline(
        request({
          target: 'ai_provider',
          provider: AIProviderName.ACTIVEPIECES,
        }),
      ),
    ).toBe(false);
    expect(
      secretRequestUtils.canSaveInline(
        request({ target: 'ai_provider', provider: 'not-a-provider' }),
      ),
    ).toBe(false);
    expect(
      secretRequestUtils.canSaveInline(
        request({ target: 'connection', piece: 'slack' }),
      ),
    ).toBe(true);
    expect(
      secretRequestUtils.canSaveInline(request({ target: 'connection' })),
    ).toBe(false);
    expect(
      secretRequestUtils.canSaveInline(request({ target: 'secret_manager' })),
    ).toBe(false);
  });
});

describe('secretRequestUtils.connectionAuth', () => {
  const secretText = PieceAuth.SecretText({
    displayName: 'API key',
    required: true,
  });
  const basic = PieceAuth.BasicAuth({
    displayName: 'Login',
    required: true,
    username: { displayName: 'Username' },
    password: { displayName: 'Password' },
  });
  const custom = PieceAuth.CustomAuth({
    required: true,
    props: {
      base_url: Property.ShortText({ displayName: 'Base URL', required: true }),
      api_key: PieceAuth.SecretText({ displayName: 'Key', required: true }),
      region: Property.ShortText({ displayName: 'Region', required: false }),
    },
  });

  it('returns null without a piece or auth', () => {
    expect(
      secretRequestUtils.connectionAuth({ piece: undefined, fields: [] }),
    ).toBeNull();
    expect(
      secretRequestUtils.connectionAuth({
        piece: { auth: undefined },
        fields: [field('key')],
      }),
    ).toBeNull();
  });

  it('matches a secret text auth with exactly one field', () => {
    expect(
      secretRequestUtils.connectionAuth({
        piece: { auth: secretText },
        fields: [field('key')],
      }),
    ).toBe(secretText);
    expect(
      secretRequestUtils.connectionAuth({
        piece: { auth: secretText },
        fields: [field('key'), field('other')],
      }),
    ).toBeNull();
  });

  it('matches basic auth only on username and password', () => {
    expect(
      secretRequestUtils.connectionAuth({
        piece: { auth: basic },
        fields: [field('username'), field('password')],
      }),
    ).toBe(basic);
    expect(
      secretRequestUtils.connectionAuth({
        piece: { auth: basic },
        fields: [field('user'), field('password')],
      }),
    ).toBeNull();
  });

  it('matches custom auth on known text props covering required ones', () => {
    expect(
      secretRequestUtils.connectionAuth({
        piece: { auth: custom },
        fields: [field('base_url'), field('api_key')],
      }),
    ).toBe(custom);
    expect(
      secretRequestUtils.connectionAuth({
        piece: { auth: custom },
        fields: [field('api_key')],
      }),
    ).toBeNull();
    expect(
      secretRequestUtils.connectionAuth({
        piece: { auth: custom },
        fields: [field('base_url'), field('api_key'), field('__proto__')],
      }),
    ).toBeNull();
  });

  it('picks the matching option from several auths', () => {
    expect(
      secretRequestUtils.connectionAuth({
        piece: { auth: [secretText, basic] },
        fields: [field('username'), field('password')],
      }),
    ).toBe(basic);
  });
});

describe('secretRequestUtils.connectionRequest', () => {
  const piece = {
    name: '@activepieces/piece-slack',
    displayName: 'Slack',
    version: '1.0.0',
  };

  it('builds a secret text body from the only value', () => {
    const body = secretRequestUtils.connectionRequest({
      piece,
      auth: PieceAuth.SecretText({ displayName: 'Key', required: true }),
      projectId: 'p1',
      values: { key: 'abc' },
    });
    expect(body).toMatchObject({
      pieceName: piece.name,
      projectId: 'p1',
      type: AppConnectionType.SECRET_TEXT,
      value: { type: AppConnectionType.SECRET_TEXT, secret_text: 'abc' },
    });
  });

  it('builds basic and custom auth bodies', () => {
    expect(
      secretRequestUtils.connectionRequest({
        piece,
        auth: PieceAuth.BasicAuth({
          displayName: 'Login',
          required: true,
          username: { displayName: 'Username' },
          password: { displayName: 'Password' },
        }),
        projectId: 'p1',
        values: { username: 'me', password: 'pw' },
      }).value,
    ).toEqual({
      type: AppConnectionType.BASIC_AUTH,
      username: 'me',
      password: 'pw',
    });
    const values = { api_key: 'k' };
    const body = secretRequestUtils.connectionRequest({
      piece,
      auth: PieceAuth.CustomAuth({ required: true, props: {} }),
      projectId: 'p1',
      values,
    });
    expect(body.value).toEqual({
      type: AppConnectionType.CUSTOM_AUTH,
      props: { api_key: 'k' },
    });
  });
});

describe('secretRequestUtils.existingProviderKey', () => {
  it('prefers the key this card created, then any key of that provider', () => {
    const openai = request({
      target: 'ai_provider',
      provider: AIProviderName.OPENAI,
    });
    const configs = [
      config({ id: 'a', provider: AIProviderName.ANTHROPIC, displayName: 'x' }),
      config({ id: 'b', provider: AIProviderName.OPENAI, displayName: 'Team' }),
      config({
        id: 'c',
        provider: AIProviderName.OPENAI,
        displayName: i18next.t('{name} key', { name: openai.name }),
      }),
    ];
    expect(
      secretRequestUtils.existingProviderKey({ request: openai, configs })?.id,
    ).toBe('c');
    expect(
      secretRequestUtils.existingProviderKey({
        request: openai,
        configs: configs.slice(0, 2),
      })?.id,
    ).toBe('b');
    expect(
      secretRequestUtils.existingProviderKey({
        request: openai,
        configs: undefined,
      }),
    ).toBeNull();
  });
});

describe('secretRequestUtils.failureOf', () => {
  it('treats non-http errors as an invalid key', () => {
    expect(secretRequestUtils.failureOf(new Error('nope'))).toBe('invalid');
    expect(secretRequestUtils.failureOf(null)).toBe('invalid');
  });
});

function field(name: string): SecretField {
  return { name, label: name, type: 'password', hint: null };
}

function request(overrides: Partial<SecretRequest>): SecretRequest {
  return {
    target: 'connection',
    piece: null,
    provider: null,
    name: 'OpenAI',
    title: 'OpenAI key',
    reason: null,
    fields: [field('apiKey')],
    ...overrides,
  };
}

function config({
  id,
  provider,
  displayName,
}: {
  id: string;
  provider: AIProviderName;
  displayName: string;
}): ExistingProviderKey {
  return { id, name: displayName, provider, config: {} };
}
