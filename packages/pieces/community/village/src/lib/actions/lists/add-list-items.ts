import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../common/auth';
import { villageApi } from '../../common/client';
import { villageSchemas } from '../../common/schemas';

const MAX_ITEMS = 100;

type AddItemRow = {
  identifier?: string;
  type?: string;
};

export const addListItems = createAction({
  auth: villageAuth,
  name: 'add_list_items',
  classification: 'WRITE',
  displayName: 'Add items to list',
  description:
    'Add people or companies to a list. Each identifier is resolved (LinkedIn URLs, company domains, emails, or graph IDs) and added. Returns detailed results per item.',
  audience: 'human',
  aiMetadata: {
    description:
      'Add up to 100 people or companies to an existing list, resolving each identifier (LinkedIn URL, company domain, email, or graph ID) to an entity. Effectively idempotent per entity: re-adding one already on the list does not duplicate it. Per-item results report which identifiers resolved and were added.',
    idempotent: true,
  },
  outputSchema: villageSchemas.addListItems,
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

    const rows: AddItemRow[] = villageApi.objectRows(items).map((row) => ({
      identifier: villageApi.rowText({ row, key: 'identifier' }),
      type: villageApi.rowText({ row, key: 'type' }),
    }));
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

    const response = await villageApi.call({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/v2/lists/${encodeURIComponent(id)}/items`,
      body: {
        items: normalizedItems,
      },
    });
    return response;
  },
});
