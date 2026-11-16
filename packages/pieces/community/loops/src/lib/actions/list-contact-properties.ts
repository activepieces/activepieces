import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { loopsAuth } from '../auth';
import { loopsClient } from '../common/client';
import { loopsSchemas } from '../common/schemas';

export const listContactProperties = createAction({
  name: 'list_contact_properties',
  classification: 'SEARCH',
  displayName: 'List Contact Properties',
  description: 'Lists the contact properties in your Loops account.',
  audience: 'both',
  outputSchema: loopsSchemas.contactProperties,
  aiMetadata: {
    description:
      'Lists Loops contact properties with their key, label and type (string, number, boolean or date). Set scope to "custom" for only your custom properties or "all" to include the default ones. Use the keys in customProperties of create_contact or update_contact. Loops returns every property at once; offset and limit page through that result. Read-only.',
    idempotent: true,
  },
  auth: loopsAuth,
  props: {
    scope: Property.StaticDropdown({
      displayName: 'Properties',
      description: 'Which properties to list.',
      required: true,
      defaultValue: 'all',
      options: {
        disabled: false,
        options: [
          { label: 'All properties', value: 'all' },
          { label: 'Custom properties only', value: 'custom' },
        ],
      },
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of properties to skip. Defaults to 0.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of properties to return. Leave empty to return all.',
      required: false,
    }),
  },
  async run(context) {
    const { scope, offset, limit } = context.propsValue;
    const body = await loopsClient.request<unknown>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/contacts/properties',
      queryParams: { list: scope === 'custom' ? 'custom' : 'all' },
    });
    const properties = loopsClient.sliceArray({ items: body, offset, limit, what: 'contact properties' });
    return { properties, count: properties.length };
  },
});
