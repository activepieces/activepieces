import { LocalesEnum } from '@activepieces/core-utils';
import { PackageType, PieceType } from '@activepieces/core-piece-types';
import { describe, expect, it } from 'vitest';
import { pieceTranslation } from '../src/lib/i18n';
import { PieceMetadataModel } from '../src/lib/piece-metadata';
import { PieceAuth, PieceAuthProperty, Property } from '../src/lib/property';

const selfHostedAuth = () =>
  PieceAuth.CustomAuth({
    displayName: 'Self-hosted',
    description: 'Connect to your own instance.',
    required: true,
    props: {
      baseUrl: Property.ShortText({
        displayName: 'Instance URL',
        description: 'Base URL of your instance.',
        required: true,
      }),
      username: Property.ShortText({
        displayName: 'Username',
        description: 'Your login username.',
        required: true,
      }),
    },
  });

const cloudAuth = () =>
  PieceAuth.SecretText({
    displayName: 'Cloud',
    description: 'Connect using an API key.',
    required: true,
  });

const regionAuth = () =>
  PieceAuth.CustomAuth({
    displayName: 'Region picker',
    description: 'Pick a region.',
    required: true,
    props: {
      region: Property.StaticDropdown({
        displayName: 'Region',
        description: 'Where your data lives.',
        required: true,
        options: {
          options: [
            { label: 'Europe', value: 'eu' },
            { label: 'United States', value: 'us' },
          ],
        },
      }),
    },
  });

const translations: Record<string, string> = {
  'A test piece.': 'Eine Testkomponente.',
  'Connect to your own instance.': 'Mit Ihrer eigenen Instanz verbinden.',
  'Instance URL': 'Instanz-URL',
  'Base URL of your instance.': 'Basis-URL Ihrer Instanz.',
  Username: 'Benutzername',
  'Your login username.': 'Ihr Anmeldename.',
  'Connect using an API key.': 'Mit einem API-Schlüssel verbinden.',
  'Pick a region.': 'Wählen Sie eine Region.',
  Region: 'Region (de)',
  'Where your data lives.': 'Wo Ihre Daten liegen.',
  Europe: 'Europa',
  'United States': 'Vereinigte Staaten',
};

const translate = (auth: PieceAuthProperty | PieceAuthProperty[]): PieceMetadataModel => {
  const piece: PieceMetadataModel = {
    name: 'test-piece',
    displayName: 'Test Piece',
    logoUrl: 'https://example.com/logo.png',
    description: 'A test piece.',
    authors: [],
    version: '0.1.0',
    auth,
    actions: {},
    triggers: {},
    contextInfo: undefined,
    projectUsage: 0,
    pieceType: PieceType.OFFICIAL,
    packageType: PackageType.REGISTRY,
    i18n: { [LocalesEnum.GERMAN]: translations },
  };
  return pieceTranslation.translatePiece({ piece, locale: LocalesEnum.GERMAN });
};

const authArrayOf = (translated: PieceMetadataModel): PieceAuthProperty[] =>
  Array.isArray(translated.auth) ? translated.auth : [];

const singleAuthOf = (translated: PieceMetadataModel): PieceAuthProperty | undefined =>
  Array.isArray(translated.auth) ? undefined : translated.auth;

const propsOf = (auth: PieceAuthProperty | undefined) =>
  auth && 'props' in auth ? auth.props : undefined;

const optionLabelsOf = (auth: PieceAuthProperty | undefined, propName: string) => {
  const property = propsOf(auth)?.[propName];
  if (!property || !('options' in property)) {
    return undefined;
  }
  const { options } = property;
  return 'options' in options ? options.options.map((option) => option.label) : undefined;
};

describe('translatePiece — pieces declaring several auth methods', () => {
  it('translates the description and props of every entry in an auth array', () => {
    const [selfHosted, cloud] = authArrayOf(translate([selfHostedAuth(), cloudAuth()]));

    expect(selfHosted.description).toBe('Mit Ihrer eigenen Instanz verbinden.');
    expect(propsOf(selfHosted)?.['baseUrl'].displayName).toBe('Instanz-URL');
    expect(propsOf(selfHosted)?.['baseUrl'].description).toBe('Basis-URL Ihrer Instanz.');
    expect(propsOf(selfHosted)?.['username'].displayName).toBe('Benutzername');
    expect(propsOf(selfHosted)?.['username'].description).toBe('Ihr Anmeldename.');
    expect(cloud.description).toBe('Mit einem API-Schlüssel verbinden.');
  });

  it('translates static dropdown option labels inside an auth array', () => {
    const [withOptions] = authArrayOf(translate([regionAuth(), cloudAuth()]));

    expect(propsOf(withOptions)?.['region'].displayName).toBe('Region (de)');
    expect(optionLabelsOf(withOptions, 'region')).toEqual(['Europa', 'Vereinigte Staaten']);
  });

  it('still translates a single auth object', () => {
    const translated = translate(selfHostedAuth());
    const auth = singleAuthOf(translated);

    expect(translated.description).toBe('Eine Testkomponente.');
    expect(auth?.description).toBe('Mit Ihrer eigenen Instanz verbinden.');
    expect(propsOf(auth)?.['baseUrl'].displayName).toBe('Instanz-URL');
  });

  it('still translates static dropdown option labels under a single auth object', () => {
    expect(optionLabelsOf(singleAuthOf(translate(regionAuth())), 'region')).toEqual([
      'Europa',
      'Vereinigte Staaten',
    ]);
  });

  it('leaves an auth value that has no translation untouched', () => {
    const untranslated = PieceAuth.SecretText({
      displayName: 'Cloud',
      description: 'Not in the locale file.',
      required: true,
    });

    expect(authArrayOf(translate([untranslated]))[0].description).toBe('Not in the locale file.');
  });
});
