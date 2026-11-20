import { describe, expect, it } from 'vitest';
import { LocalesEnum } from '@activepieces/core-utils';
import { PackageType, PieceCategory, PieceType } from '@activepieces/core-piece-types';
import { createAction } from '../src/lib/action/action';
import { pieceTranslation } from '../src/lib/i18n';
import { pieceTranslationPaths } from '../src/lib/i18n-paths';
import { createPiece } from '../src/lib/piece';
import { PieceMetadataModel } from '../src/lib/piece-metadata';
import { PieceAuth, Property } from '../src/lib/property';
import { createTrigger, TriggerStrategy } from '../src/lib/trigger/trigger';

const buildPiece = ({ categories = [], auth = PieceAuth.SecretText({ displayName: 'API key', description: 'Your API key', required: true }) }: BuildPieceParams = {}): PieceMetadataModel => JSON.parse(JSON.stringify({
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

describe('pieceTranslationPaths.extract', () => {
  it('returns one concrete path per translatable string', () => {
    expect(pieceTranslationPaths.englishByPath({ piece: buildPiece() })).toEqual({
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
    const piece = buildPiece();
    const mode = piece.actions['upload_file'].props['mode'];
    const reordered = structuredClone(piece);
    const options = [{ label: 'New', value: 'new' }, { label: 'Overwrite', value: 'overwrite' }, { label: 'Add', value: 'add' }];
    reordered.actions['upload_file'].props['mode'] = { ...mode, options: { disabled: false, options } };

    const paths = pieceTranslationPaths.englishByPath({ piece: reordered });

    expect(paths['actions.upload_file.props.mode.options.options[value=add].label']).toBe('Add');
    expect(paths['actions.upload_file.props.mode.options.options[value=overwrite].label']).toBe('Overwrite');
  });

  it('includes the display name of core pieces only', () => {
    expect(pieceTranslationPaths.englishByPath({ piece: buildPiece({ categories: [PieceCategory.CORE] }) })['displayName']).toBe('Dropbox');
    expect(pieceTranslationPaths.englishByPath({ piece: buildPiece() })['displayName']).toBeUndefined();
  });

  it('extracts custom auth props', () => {
    const auth = PieceAuth.CustomAuth({
      description: 'Connect',
      required: true,
      props: {
        region: Property.StaticDropdown({ displayName: 'Region', required: true, options: { options: [{ label: 'Europe', value: 'eu' }] } }),
      },
    });

    expect(pieceTranslationPaths.englishByPath({ piece: buildPiece({ auth }) })).toMatchObject({
      'auth.description': 'Connect',
      'auth.props.region.displayName': 'Region',
      'auth.props.region.options.options[value=eu].label': 'Europe',
    });
  });

  it('skips multi-auth arrays, matching the runtime which does not translate them either', () => {
    const piece = { ...buildPiece(), auth: [PieceAuth.SecretText({ displayName: 'Key', description: 'Multi', required: true })] };

    expect(Object.keys(pieceTranslationPaths.englishByPath({ piece })).filter((path) => path.startsWith('auth'))).toEqual([]);
  });

  it('covers exactly the strings the runtime translates', () => {
    const piece = buildPiece();
    const strings = pieceTranslationPaths.extract({ piece });
    const translations = Object.fromEntries(strings.map(({ english }) => [english, `«${english}»`]));

    const translated = pieceTranslation.translatePiece({ piece: { ...piece, i18n: { [LocalesEnum.FRENCH]: translations } }, locale: LocalesEnum.FRENCH });
    const roundTrip = pieceTranslationPaths.extract({ piece: translated });

    expect(roundTrip.map(({ path }) => path)).toEqual(strings.map(({ path }) => path));
    expect(roundTrip.every(({ english }) => english.startsWith('«'))).toBe(true);
  });
});


type BuildPieceParams = {
  categories?: PieceCategory[]
  auth?: ReturnType<typeof PieceAuth.SecretText> | ReturnType<typeof PieceAuth.CustomAuth>
}
