import { describe, expect, it } from 'vitest';
import { LocalesEnum } from '@activepieces/core-utils';
import { PackageType, PieceType } from '@activepieces/core-piece-types';
import { createAction } from '../src/lib/action/action';
import { pieceTranslation } from '../src/lib/i18n';
import { createPiece } from '../src/lib/piece';
import { PieceMetadataModel } from '../src/lib/piece-metadata';
import { PieceAuth, Property } from '../src/lib/property';

const buildPiece = (): PieceMetadataModel => JSON.parse(JSON.stringify({
  ...createPiece({
    displayName: 'Mailer',
    description: 'Send mail',
    logoUrl: 'https://example.com/logo.png',
    auth: PieceAuth.SecretText({ displayName: 'API key', description: 'Your API key', required: true }),
    actions: [
      createAction({
        name: 'send',
        displayName: 'Send email',
        description: 'Sends an email',
        props: {
          to: Property.ShortText({ displayName: 'To', required: true }),
          format: Property.StaticDropdown({
            displayName: 'Format',
            required: true,
            options: { options: [{ label: 'Plain', value: 'plain' }, { label: 'HTML', value: 'html' }] },
          }),
        },
        run: async () => undefined,
      }),
      createAction({
        name: 'archive',
        displayName: 'Archive',
        props: {},
        run: async () => undefined,
      }),
    ],
    triggers: [],
  }).metadata(),
  name: '@activepieces/piece-mailer',
  version: '0.1.0',
  projectUsage: 0,
  pieceType: PieceType.OFFICIAL,
  packageType: PackageType.REGISTRY,
  i18n: {
    [LocalesEnum.JAPANESE]: {
      'Send mail': 'メール送信',
      'Your API key': 'あなたのAPIキー',
      'Send email': 'メールを送信',
      'To': '宛先',
      'HTML': 'HTML形式',
    },
  },
}));

const databaseTokenAuth = () =>
  PieceAuth.CustomAuth({
    displayName: 'Database Token (recommended)',
    description: 'Scoped, per-table access that works with 2FA.',
    required: true,
    props: {
      apiUrl: Property.ShortText({
        displayName: 'API URL',
        description: 'Your Baserow instance URL.',
        required: true,
      }),
      region: Property.StaticDropdown({
        displayName: 'Region',
        description: 'Where your workspace is hosted.',
        required: true,
        options: {
          disabled: false,
          options: [{ label: 'Europe (EU)', value: 'eu' }],
        },
      }),
      token: PieceAuth.SecretText({
        displayName: 'Database Token',
        description: 'Your Baserow database token.',
        required: true,
      }),
    },
  });

const emailPasswordAuth = () =>
  PieceAuth.BasicAuth({
    displayName: 'Email & Password (JWT)',
    description: 'Needed to register webhooks automatically.',
    required: true,
    username: {
      displayName: 'Email',
      description: 'Your Baserow account email.',
    },
    password: {
      displayName: 'Password',
      description: 'Your Baserow account password.',
    },
  });

const listRows = () =>
  createAction({
    name: 'list_rows',
    displayName: 'List Rows',
    description: 'List the rows of a table.',
    props: {},
    run: async () => [],
  });

const french: Record<string, string> = {
  'Read and write rows in Baserow.': 'Lire et écrire des lignes dans Baserow.',
  'Database Token (recommended)': 'Jeton de base de données (recommandé)',
  'Scoped, per-table access that works with 2FA.': 'Accès par table, compatible avec la 2FA.',
  'API URL': "URL de l'API",
  'Your Baserow instance URL.': "L'URL de votre instance Baserow.",
  Region: 'Région',
  'Where your workspace is hosted.': 'Où votre espace de travail est hébergé.',
  'Europe (EU)': 'Europe (UE)',
  'Database Token': 'Jeton de base de données',
  'Your Baserow database token.': 'Votre jeton de base de données Baserow.',
  'Email & Password (JWT)': 'E-mail et mot de passe (JWT)',
  'Needed to register webhooks automatically.': 'Nécessaire pour enregistrer les webhooks automatiquement.',
  Email: 'E-mail',
  'Your Baserow account email.': "L'e-mail de votre compte Baserow.",
  Password: 'Mot de passe',
  'Your Baserow account password.': 'Le mot de passe de votre compte Baserow.',
  'List Rows': 'Lister les lignes',
};

const build = (auth: Parameters<typeof createPiece>[0]['auth']): PieceMetadataModel => ({
  ...createPiece({
    displayName: 'Baserow',
    description: 'Read and write rows in Baserow.',
    logoUrl: 'https://example.com/logo.png',
    authors: [],
    auth,
    actions: [listRows()],
    triggers: [],
  }).metadata(),
  name: '@activepieces/piece-baserow',
  version: '0.1.0',
  authors: [],
  projectUsage: 0,
  pieceType: PieceType.OFFICIAL,
  packageType: PackageType.REGISTRY,
  i18n: { [LocalesEnum.FRENCH]: french },
});

const translate = (auth: Parameters<typeof createPiece>[0]['auth']) =>
  pieceTranslation.translatePiece<PieceMetadataModel>({
    piece: build(auth),
    locale: LocalesEnum.FRENCH,
  });

const methods = (auth: PieceMetadataModel['auth']) => (Array.isArray(auth) ? auth : []);

describe('pieceTranslation.translatePiece', () => {
  it('translates every configured path', () => {
    const translated = pieceTranslation.translatePiece({ piece: buildPiece(), locale: LocalesEnum.JAPANESE });

    expect(translated.description).toBe('メール送信');
    expect(translated.auth).toMatchObject({ displayName: 'API key', description: 'あなたのAPIキー' });
    expect(translated.actions['send'].displayName).toBe('メールを送信');
    expect(translated.actions['send'].props['to'].displayName).toBe('宛先');
    expect(translated.actions['send'].props['format']).toMatchObject({
      options: { options: [{ label: 'Plain', value: 'plain' }, { label: 'HTML形式', value: 'html' }] },
    });
  });

  it('never mutates the input piece', () => {
    const piece = buildPiece();
    const snapshot = structuredClone(piece);

    pieceTranslation.translatePiece({ piece, locale: LocalesEnum.JAPANESE });

    expect(piece).toEqual(snapshot);
  });

  it('shares untranslated subtrees with the input instead of copying them', () => {
    const piece = buildPiece();

    const translated = pieceTranslation.translatePiece({ piece, locale: LocalesEnum.JAPANESE });

    expect(translated.actions['archive']).toBe(piece.actions['archive']);
    expect(translated.triggers).toBe(piece.triggers);
  });

  it('returns the same piece when the locale has no translations', () => {
    const piece = buildPiece();

    expect(pieceTranslation.translatePiece({ piece, locale: LocalesEnum.GERMAN })).toBe(piece);
  });
});

describe('translatePiece on a piece exposing several auth methods', () => {
  it('translates the display name of every method', () => {
    expect(methods(translate([databaseTokenAuth(), emailPasswordAuth()]).auth).map((method) => method.displayName))
      .toStrictEqual(['Jeton de base de données (recommandé)', 'E-mail et mot de passe (JWT)']);
  });

  it('translates the description of every method', () => {
    expect(methods(translate([databaseTokenAuth(), emailPasswordAuth()]).auth).map((method) => method.description))
      .toStrictEqual([
        'Accès par table, compatible avec la 2FA.',
        'Nécessaire pour enregistrer les webhooks automatiquement.',
      ]);
  });

  it('translates the props of a custom auth method, including dropdown labels', () => {
    expect(methods(translate([databaseTokenAuth(), emailPasswordAuth()]).auth)[0]).toMatchObject({
      props: {
        apiUrl: {
          displayName: "URL de l'API",
          description: "L'URL de votre instance Baserow.",
        },
        region: {
          displayName: 'Région',
          description: 'Où votre espace de travail est hébergé.',
          options: { options: [{ label: 'Europe (UE)', value: 'eu' }] },
        },
        token: {
          displayName: 'Jeton de base de données',
          description: 'Votre jeton de base de données Baserow.',
        },
      },
    });
  });

  it('translates the username and password of a basic auth method', () => {
    expect(methods(translate([databaseTokenAuth(), emailPasswordAuth()]).auth)[1]).toMatchObject({
      username: {
        displayName: 'E-mail',
        description: "L'e-mail de votre compte Baserow.",
      },
      password: {
        displayName: 'Mot de passe',
        description: 'Le mot de passe de votre compte Baserow.',
      },
    });
  });
});

describe('translatePiece on a piece exposing a single auth method', () => {
  it('translates the auth description and props', () => {
    expect(translate(databaseTokenAuth()).auth).toMatchObject({
      description: 'Accès par table, compatible avec la 2FA.',
      props: {
        apiUrl: { displayName: "URL de l'API" },
        region: { options: { options: [{ label: 'Europe (UE)', value: 'eu' }] } },
      },
    });
  });

  it('translates every prop of a custom auth whose props are named username and password', () => {
    const auth = PieceAuth.CustomAuth({
      displayName: 'Database Token (recommended)',
      description: 'Scoped, per-table access that works with 2FA.',
      required: true,
      props: {
        apiUrl: Property.ShortText({ displayName: 'API URL', required: true }),
        username: Property.ShortText({ displayName: 'Email', required: true }),
        password: PieceAuth.SecretText({ displayName: 'Password', required: true }),
      },
    });
    expect(translate(auth).auth).toMatchObject({
      props: {
        apiUrl: { displayName: "URL de l'API" },
        username: { displayName: 'E-mail' },
        password: { displayName: 'Mot de passe' },
      },
    });
  });

  it('walks past an auth prop named after a path segment', () => {
    const auth = PieceAuth.CustomAuth({
      displayName: 'Database Token (recommended)',
      description: 'Scoped, per-table access that works with 2FA.',
      required: true,
      props: {
        description: Property.ShortText({
          displayName: 'API URL',
          description: 'Your Baserow instance URL.',
          required: true,
        }),
      },
    });
    const piece = translate(auth);
    expect(piece.description).toBe('Lire et écrire des lignes dans Baserow.');
    expect(piece.actions['list_rows'].displayName).toBe('Lister les lignes');
    expect(piece.auth).toMatchObject({
      description: 'Accès par table, compatible avec la 2FA.',
      props: { description: { displayName: "URL de l'API" } },
    });
  });
});
