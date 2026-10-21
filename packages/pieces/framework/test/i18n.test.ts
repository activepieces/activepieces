import { describe, expect, it } from 'vitest';
import { LocalesEnum } from '@activepieces/core-utils';
import { PackageType, PieceCategory, PieceType } from '@activepieces/core-piece-types';
import { createAction } from '../src/lib/action/action';
import { pieceTranslation } from '../src/lib/i18n';
import { createPiece } from '../src/lib/piece';
import { PieceMetadataModel } from '../src/lib/piece-metadata';
import { PieceAuth, Property } from '../src/lib/property';

const buildPiece = (categories: PieceCategory[] = []): PieceMetadataModel => JSON.parse(JSON.stringify({
  ...createPiece({
    displayName: 'Mailer',
    categories,
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
      'Mailer': 'メーラー',
      'Send mail': 'メール送信',
      'Your API key': 'あなたのAPIキー',
      'Send email': 'メールを送信',
      'To': '宛先',
      'HTML': 'HTML形式',
    },
  },
}));

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

  it('translates the display name of a core piece', () => {
    const translated = pieceTranslation.translatePiece({ piece: buildPiece([PieceCategory.CORE]), locale: LocalesEnum.JAPANESE });

    expect(translated.displayName).toBe('メーラー');
  });

  it('keeps the display name of a non-core piece untranslated', () => {
    const translated = pieceTranslation.translatePiece({ piece: buildPiece([PieceCategory.COMMUNICATION]), locale: LocalesEnum.JAPANESE });

    expect(translated.displayName).toBe('Mailer');
  });
});
