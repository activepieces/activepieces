import { describe, expect, it } from 'vitest';
import { LocalesEnum } from '@activepieces/core-utils';
import { PackageType, PieceCategory, PieceType } from '@activepieces/core-piece-types';
import { createAction } from '../src/lib/action/action';
import { pieceTranslation } from '../src/lib/i18n';
import { createPiece } from '../src/lib/piece';
import { PieceMetadataModel } from '../src/lib/piece-metadata';
import { PieceAuth, Property } from '../src/lib/property';
import { createTrigger, TriggerStrategy } from '../src/lib/trigger/trigger';

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

const buildDropboxPiece = ({ categories = [], auth = PieceAuth.SecretText({ displayName: 'API key', description: 'Your API key', required: true }) }: BuildDropboxPieceParams = {}): PieceMetadataModel => JSON.parse(JSON.stringify({
  ...createPiece({
    displayName: 'Dropbox',
    categories,
    description: 'Cloud storage',
    logoUrl: 'https://example.com/logo.png',
    auth,
    actions: [
      createAction({
        name: 'upload_file',
        displayName: 'Upload File',
        description: 'Upload a file',
        propertyGroups: [
          { key: 'target', display: 'section', label: 'Target', icon: 'folder', props: ['path'] },
          { key: 'options', display: 'section', label: 'Options', description: 'How to write', icon: 'sliders', props: ['mode', 'dupes', 'empty'] },
        ],
        props: {
          path: Property.ShortText({ displayName: 'Path', description: 'Where to upload', required: true }),
          mode: Property.StaticDropdown({
            displayName: 'Write Mode',
            required: true,
            options: { options: [{ label: 'Add', value: 'add' }, { label: 'Overwrite', value: 'overwrite' }, { label: 'Ten', value: 10 }, { label: 'Off', value: false }] },
          }),
          dupes: Property.StaticDropdown({
            displayName: 'Duplicates',
            required: false,
            options: { options: [{ label: 'First', value: 'x' }, { label: 'Second', value: 'x' }, { label: 'Third', value: 'y' }] },
          }),
          empty: Property.ShortText({ displayName: 'Empty', description: '', required: false }),
        },
        run: async () => undefined,
      }),
    ],
    triggers: [
      createTrigger({
        name: 'new_file',
        displayName: 'New File',
        description: 'Fires on a new file',
        props: {},
        type: TriggerStrategy.POLLING,
        sampleData: {},
        onEnable: async () => undefined,
        onDisable: async () => undefined,
        run: async () => [],
      }),
    ],
  }).metadata(),
  name: '@activepieces/piece-dropbox',
  version: '0.1.0',
  projectUsage: 0,
  pieceType: PieceType.OFFICIAL,
  packageType: PackageType.REGISTRY,
}));

describe('pieceTranslation.translatableTextByJsonPath', () => {
  it('returns one concrete path per translatable string', () => {
    expect(pieceTranslation.translatableTextByJsonPath({ piece: buildDropboxPiece() })).toEqual({
      'description': 'Cloud storage',
      'auth.description': 'Your API key',
      'actions.upload_file.displayName': 'Upload File',
      'actions.upload_file.description': 'Upload a file',
      'actions.upload_file.props.path.displayName': 'Path',
      'actions.upload_file.props.path.description': 'Where to upload',
      'actions.upload_file.props.mode.displayName': 'Write Mode',
      'actions.upload_file.props.dupes.displayName': 'Duplicates',
      'actions.upload_file.props.empty.displayName': 'Empty',
      'actions.upload_file.props.mode.options.options[value=add].label': 'Add',
      'actions.upload_file.props.mode.options.options[value=overwrite].label': 'Overwrite',
      'actions.upload_file.props.mode.options.options[value=10].label': 'Ten',
      'actions.upload_file.props.mode.options.options[value=false].label': 'Off',
      'actions.upload_file.props.dupes.options.options[0].label': 'First',
      'actions.upload_file.props.dupes.options.options[1].label': 'Second',
      'actions.upload_file.props.dupes.options.options[value=y].label': 'Third',
      'actions.upload_file.propertyGroups[key=target].label': 'Target',
      'actions.upload_file.propertyGroups[key=options].label': 'Options',
      'actions.upload_file.propertyGroups[key=options].description': 'How to write',
      'triggers.new_file.displayName': 'New File',
      'triggers.new_file.description': 'Fires on a new file',
    });
  });

  it('keeps an option path stable when options are reordered or inserted', () => {
    const piece = buildDropboxPiece();
    const mode = piece.actions['upload_file'].props['mode'];
    const reordered = structuredClone(piece);
    const options = [{ label: 'New', value: 'new' }, { label: 'Overwrite', value: 'overwrite' }, { label: 'Add', value: 'add' }];
    reordered.actions['upload_file'].props['mode'] = { ...mode, options: { disabled: false, options } };

    const paths = pieceTranslation.translatableTextByJsonPath({ piece: reordered });

    expect(paths['actions.upload_file.props.mode.options.options[value=add].label']).toBe('Add');
    expect(paths['actions.upload_file.props.mode.options.options[value=overwrite].label']).toBe('Overwrite');
  });

  it('includes the display name of core pieces only', () => {
    expect(pieceTranslation.translatableTextByJsonPath({ piece: buildDropboxPiece({ categories: [PieceCategory.CORE] }) })['displayName']).toBe('Dropbox');
    expect(pieceTranslation.translatableTextByJsonPath({ piece: buildDropboxPiece() })['displayName']).toBeUndefined();
  });

  it('extracts custom auth props', () => {
    const auth = PieceAuth.CustomAuth({
      description: 'Connect',
      required: true,
      props: {
        region: Property.StaticDropdown({ displayName: 'Region', required: true, options: { options: [{ label: 'Europe', value: 'eu' }] } }),
      },
    });

    expect(pieceTranslation.translatableTextByJsonPath({ piece: buildDropboxPiece({ auth }) })).toMatchObject({
      'auth.description': 'Connect',
      'auth.props.region.displayName': 'Region',
      'auth.props.region.options.options[value=eu].label': 'Europe',
    });
  });

  it('skips multi-auth arrays, matching the runtime which does not translate them either', () => {
    const piece = { ...buildDropboxPiece(), auth: [PieceAuth.SecretText({ displayName: 'Key', description: 'Multi', required: true })] };

    expect(Object.keys(pieceTranslation.translatableTextByJsonPath({ piece })).filter((path) => path.startsWith('auth'))).toEqual([]);
  });

  it('covers exactly the strings the runtime translates', () => {
    const piece = buildDropboxPiece();
    const textByJsonPath = pieceTranslation.translatableTextByJsonPath({ piece });
    const translations = Object.fromEntries(Object.values(textByJsonPath).map((english) => [english, `«${english}»`]));

    const translated = pieceTranslation.translatePiece({ piece: { ...piece, i18n: { [LocalesEnum.FRENCH]: translations } }, locale: LocalesEnum.FRENCH });
    const roundTrip = pieceTranslation.translatableTextByJsonPath({ piece: translated });

    expect(Object.keys(roundTrip)).toEqual(Object.keys(textByJsonPath));
    expect(Object.values(roundTrip).every((text) => text.startsWith('«'))).toBe(true);
  });

  it('falls back to the index for an element without a value or key', () => {
    const piece = { actions: { send: { props: { format: { options: { options: [{ label: 'No value' }, { label: 'Has value', value: 'v' }] } } } } } };

    expect(pieceTranslation.translatableTextByJsonPath({ piece })).toEqual({
      'actions.send.props.format.options.options[0].label': 'No value',
      'actions.send.props.format.options.options[value=v].label': 'Has value',
    });
  });
});

type BuildDropboxPieceParams = {
  categories?: PieceCategory[]
  auth?: ReturnType<typeof PieceAuth.SecretText> | ReturnType<typeof PieceAuth.CustomAuth>
}
