import { Property, createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../..';
import { getAsset } from '../common';

export const getAssetAction = createAction({
  auth: shopifyAuth,
  name: 'get_asset',
  classification: 'READ',
  displayName: 'Get Theme File',
  description: 'Get a file from a theme, like a template.',
  audience: 'both',
  aiMetadata: { description: "Fetch a single asset (e.g. a template, snippet, or stylesheet) from a Shopify theme by asset key and theme ID. Use to read theme file contents; both the asset key and theme ID are required. Read-only and idempotent.", idempotent: true },
  propertyGroups: [
    {
      key: 'file',
      display: 'section',
      label: 'Theme file',
      icon: 'file',
      props: ['themeId', 'key'],
    },
  ],
  props: {
    key: Property.ShortText({
      displayName: 'File Path',
      description: "The file's path in the theme.",
      placeholder: 'templates/index.liquid',
      required: true,
    }),
    themeId: Property.ShortText({
      displayName: 'Theme ID',
      description: "The number after /themes/ in the theme editor's URL.",
      placeholder: '1234567890',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { key, themeId } = propsValue;

    return await getAsset(key, +themeId, auth);
  },
});
