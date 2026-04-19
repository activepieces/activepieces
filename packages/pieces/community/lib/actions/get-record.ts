import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { RESOURCE_CONFIG, RESOURCE_OPTIONS } from '../common/constants';
import { ninjapipeApiRequest } from '../common/client';
import { flattenCustomFields } from '../common/helpers';

export const getRecord = createAction({
  auth: ninjapipeAuth,
  name: 'get_record',
  displayName: 'Get Record',
  description: 'Get a single record by ID from NinjaPipe',
  props: {
    resource: Property.StaticDropdown({
      displayName: 'Resource',
      required: true,
      options: { options: RESOURCE_OPTIONS },
    }),
    id: Property.ShortText({
      displayName: 'Record ID',
      required: true,
    }),
    flattenCustomFields: Property.Checkbox({
      displayName: 'Flatten Custom Fields',
      description: 'Flatten custom_fields object to top-level',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const resource = propsValue.resource as string;
    const id = propsValue.id as string;
    const config = RESOURCE_CONFIG[resource];

    if (!config) {
      throw new Error(`Unknown resource: ${resource}`);
    }

    const response = await ninjapipeApiRequest(
      auth as { base_url: string; api_key: string },
      HttpMethod.GET,
      `${config.path}/${id}`,
    );

    if (propsValue.flattenCustomFields) {
      return flattenCustomFields(response as Record<string, unknown>);
    }

    return response;
  },
});
