import { describe, expect, it } from 'vitest';
import { LocalesEnum } from '@activepieces/core-utils';
import { PackageType, PieceType } from '@activepieces/core-piece-types';
import { createAction } from '../src/lib/action/action';
import { createTrigger, TriggerStrategy } from '../src/lib/trigger/trigger';
import { createPiece } from '../src/lib/piece';
import { pieceTranslation } from '../src/lib/i18n';
import { PieceAuth, Property } from '../src/lib/property';
import { PieceMetadataModel } from '../src/lib/piece-metadata';

const action = createAction({
  name: 'update_item',
  displayName: 'Update Item',
  description: 'Updates an item.',
  propertyGroups: [
    { key: 'item', display: 'section', label: 'Item to Update', icon: 'tag', props: ['item_id'] },
    { key: 'unlabelled', display: 'section', props: ['name'] },
  ],
  props: {
    item_id: Property.ShortText({ displayName: 'Item ID', required: true }),
    name: Property.ShortText({ displayName: 'Name', required: false }),
  },
  run: async () => undefined,
});

const trigger = createTrigger({
  name: 'new_item',
  displayName: 'New Item',
  description: 'Fires when an item is created.',
  type: TriggerStrategy.WEBHOOK,
  propertyGroups: [
    { key: 'watch', display: 'section', label: 'Where to Watch', icon: 'inbox', props: ['folder'] },
  ],
  props: {
    folder: Property.ShortText({ displayName: 'Folder', required: true }),
  },
  sampleData: {},
  onEnable: async () => undefined,
  onDisable: async () => undefined,
  run: async () => [],
});

const translate = (i18n: Record<string, string>): PieceMetadataModel => {
  const metadata = createPiece({
    displayName: 'Test',
    logoUrl: 'https://example.com/logo.png',
    auth: PieceAuth.None(),
    authors: [],
    actions: [action],
    triggers: [trigger],
  }).metadata();
  const piece: PieceMetadataModel = {
    ...metadata,
    authors: [],
    name: '@activepieces/piece-test',
    version: '0.0.1',
    projectUsage: 0,
    pieceType: PieceType.OFFICIAL,
    packageType: PackageType.REGISTRY,
    i18n: { [LocalesEnum.GERMAN]: i18n },
  };
  return pieceTranslation.translatePiece({ piece, locale: LocalesEnum.GERMAN });
};

describe('pieceTranslation.translatePiece', () => {
  it('translates section labels on actions and triggers', () => {
    const translated = translate({
      'Item to Update': 'Zu aktualisierendes Element',
      'Where to Watch': 'Zu beobachten',
    });
    expect(translated.actions['update_item'].propertyGroups?.[0].label).toBe('Zu aktualisierendes Element');
    expect(translated.triggers['new_item'].propertyGroups?.[0].label).toBe('Zu beobachten');
  });

  it('leaves a group without a label and an untranslated label as they are', () => {
    const translated = translate({});
    expect(translated.actions['update_item'].propertyGroups?.[0].label).toBe('Item to Update');
    expect(translated.actions['update_item'].propertyGroups?.[1].label).toBeUndefined();
  });
});
