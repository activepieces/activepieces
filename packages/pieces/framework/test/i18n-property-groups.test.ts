import { describe, expect, it } from 'vitest';
import { LocalesEnum } from '@activepieces/core-utils';
import { PackageType, PieceType } from '@activepieces/core-piece-types';
import { createAction } from '../src/lib/action/action';
import { pieceTranslation } from '../src/lib/i18n';
import { createPiece } from '../src/lib/piece';
import { PieceMetadataModel } from '../src/lib/piece-metadata';
import { Property } from '../src/lib/property';

describe('translatePiece and property groups', () => {
  it('translates the label and description of each group', () => {
    const translated = pieceTranslation.translatePiece({ piece: buildPiece(), locale: LocalesEnum.GERMAN });

    expect(translated.actions['add_contact'].propertyGroups).toEqual([
      { key: 'name', display: 'section', label: 'Name (de)', icon: 'user', props: ['firstName'] },
      { key: 'work', display: 'section', label: 'Arbeit', description: 'Wo die Person arbeitet', icon: 'tag', props: ['company'] },
    ]);
  });

  it('leaves a group label without a translation as it is', () => {
    const piece = buildPiece();
    const translated = pieceTranslation.translatePiece({
      piece: { ...piece, i18n: { [LocalesEnum.GERMAN]: { Work: 'Arbeit' } } },
      locale: LocalesEnum.GERMAN,
    });

    expect(translated.actions['add_contact'].propertyGroups?.map((group) => group.label)).toEqual(['Name', 'Arbeit']);
  });

  it('lists the group paths among the values to translate', () => {
    expect(pieceTranslation.pathsToValuesToTranslate).toEqual(
      expect.arrayContaining([
        'actions.*.propertyGroups.*.label',
        'actions.*.propertyGroups.*.description',
        'triggers.*.propertyGroups.*.label',
        'triggers.*.propertyGroups.*.description',
      ]),
    );
  });
});

function buildPiece(): PieceMetadataModel {
  const metadata = createPiece({
    displayName: 'Contacts',
    logoUrl: 'https://example.com/logo.png',
    auth: undefined,
    authors: [],
    actions: [
      createAction({
        name: 'add_contact',
        displayName: 'Add Contact',
        description: 'Add a contact',
        propertyGroups: [
          { key: 'name', display: 'section', label: 'Name', icon: 'user', props: ['firstName'] },
          { key: 'work', display: 'section', label: 'Work', description: 'Where the person works', icon: 'tag', props: ['company'] },
        ],
        props: {
          firstName: Property.ShortText({ displayName: 'First Name', required: true }),
          company: Property.ShortText({ displayName: 'Company', required: false }),
        },
        run: async () => undefined,
      }),
    ],
    triggers: [],
  }).metadata();
  return {
    ...metadata,
    name: '@activepieces/piece-contacts',
    version: '0.1.0',
    authors: [],
    projectUsage: 0,
    pieceType: PieceType.OFFICIAL,
    packageType: PackageType.REGISTRY,
    i18n: {
      [LocalesEnum.GERMAN]: {
        Name: 'Name (de)',
        Work: 'Arbeit',
        'Where the person works': 'Wo die Person arbeitet',
      },
    },
  };
}
