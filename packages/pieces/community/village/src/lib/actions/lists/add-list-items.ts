import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { villageAuth, VILLAGE_API_BASE_URL } from '../../common/auth';

const MAX_ITEMS = 100;

type AddItemRow = {
  identifier?: string;
  type?: string;
};

export const addListItems = createAction({
  auth: villageAuth,
  name: 'add_list_items',
  displayName: 'Add items to list',
  description:
    'Add people or companies to a list. Each identifier is resolved (LinkedIn URLs, company domains, emails, or graph IDs) and added. Returns detailed results per item.',
  audience: 'both',
  aiMetadata: {
    description:
      'Add up to 100 people or companies to an existing list, resolving each identifier (LinkedIn URL, company domain, email, or graph ID) to an entity. Effectively idempotent per entity: re-adding one already on the list does not duplicate it. Per-item results report which identifiers resolved and were added.',
    idempotent: true,
  },
  props: {
    id: Property.ShortText({
      displayName: 'List ID',
      description: 'List ID',
      required: true,
    }),
    items: Property.Array({
      displayName: 'Items',
      description: 'Items to add to the list (max 100)',
      required: true,
      properties: {
        identifier: Property.ShortText({
          displayName: 'Identifier',
          description: 'Identifier for the entity (LinkedIn URL, domain, email, or graph ID)',
          required: true,
        }),
        type: Property.StaticDropdown({
          displayName: 'Type',
          description: 'Entity type hint (optional, inferred from identifier if not provided)',
          required: false,
          options: {
            options: [
              { label: 'People', value: 'people' },
              { label: 'Company', value: 'company' },
            ],
          },
        }),
      },
    }),
  },
  async run(context) {
    const { id, items } = context.propsValue;

    const rows = (items ?? []) as AddItemRow[];
    if (rows.length === 0) {
      throw new Error('At least one item is required');
    }
    if (rows.length > MAX_ITEMS) {
      throw new Error(`Maximum ${MAX_ITEMS} items per request`);
    }

    const normalizedItems = rows.map((row, index) => {
      if (!row.identifier) {
        throw new Error(`Item at index ${index} is missing required 'identifier'`);
      }
      const entry: { identifier: string; type?: string } = { identifier: row.identifier };
      if (row.type) entry.type = row.type;
      return entry;
    });

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${VILLAGE_API_BASE_URL}/v2/lists/${encodeURIComponent(id)}/items`,
      headers: { Authorization: `Bearer ${context.auth.secret_text}` },
      body: {
        items: normalizedItems,
      },
    });
    return response.body;
  },
});
