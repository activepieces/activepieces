import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { RESOURCE_CONFIG, RESOURCE_OPTIONS } from '../common/constants';
import { ninjapipeApiRequest } from '../common/client';

export const deleteRecord = createAction({
  auth: ninjapipeAuth,
  name: 'delete_record',
  displayName: 'Delete Record',
  description: 'Delete a record from NinjaPipe',
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
      HttpMethod.DELETE,
      `${config.path}/${id}`,
    );

    return { success: true, id, resource };
  },
});
