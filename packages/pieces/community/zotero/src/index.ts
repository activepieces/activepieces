import { PieceAuth, Property, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getItems } from './lib/actions/get-items';
import { createItem } from './lib/actions/create-item';
import { newItem } from './lib/triggers/new-item';

export const zoteroAuth = PieceAuth.CustomAuth({
  description: 'Connect your Zotero library.',
  required: true,
  props: {
    api_key: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Generate at https://www.zotero.org/settings/keys/new — select Read/Write access.',
      required: true,
    }),
    user_or_group: Property.StaticDropdown({
      displayName: 'Library Type',
      description: 'Connect a personal user library or a group library.',
      required: true,
      defaultValue: 'user',
      options: {
        options: [
          { label: 'User (Personal Library)', value: 'user' },
          { label: 'Group Library', value: 'group' },
        ],
      },
    }),
    library_id: Property.ShortText({
      displayName: 'Library ID',
      description: 'Your user ID (found at zotero.org/settings/keys) or group ID.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const prefix = auth.user_or_group === 'user' ? 'users' : 'groups';
      const resp = await fetch(
        `https://api.zotero.org/${prefix}/${auth.library_id}/items?limit=1`,
        { headers: { 'Zotero-API-Key': auth.api_key, 'Zotero-API-Version': '3' } }
      );
      if (resp.ok) return { valid: true };
      return { valid: false, error: 'Invalid Zotero API key or library ID.' };
    } catch {
      return { valid: false, error: 'Could not reach Zotero API.' };
    }
  },
});

export const zotero = createPiece({
  displayName: 'Zotero',
  description: 'Manage your Zotero research library — add references, retrieve items, and trigger workflows when new items are saved.',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/zotero.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ['Tosh94'],
  auth: zoteroAuth,
  actions: [getItems, createItem],
  triggers: [newItem],
});
