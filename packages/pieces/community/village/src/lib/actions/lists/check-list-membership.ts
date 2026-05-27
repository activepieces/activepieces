import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { villageAuth, VILLAGE_API_BASE_URL } from '../../common/auth';

const MAX_ENTITY_IDS = 1000;

export const checkListMembership = createAction({
  auth: villageAuth,
  name: 'check_list_membership',
  displayName: 'Check list membership',
  description:
    'Check which lists contain the given entities. Returns a map of entity_id to the lists that contain it. Entities not in any list are omitted.',
  props: {
    entity_ids: Property.Array({
      displayName: 'Entity IDs',
      description: 'Array of entity IDs (person or company IDs) to check membership for (max 1000)',
      required: true,
    }),
    entity_type: Property.StaticDropdown({
      displayName: 'Entity Type',
      description: 'Type of entities being checked',
      required: true,
      options: {
        options: [
          { label: 'People', value: 'people' },
          { label: 'Company', value: 'company' },
        ],
      },
    }),
  },
  async run(context) {
    const { entity_ids, entity_type } = context.propsValue;

    const ids = (entity_ids ?? []) as string[];
    if (ids.length === 0) {
      throw new Error('At least one entity ID is required');
    }
    if (ids.length > MAX_ENTITY_IDS) {
      throw new Error(`Maximum ${MAX_ENTITY_IDS} entity IDs per request`);
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${VILLAGE_API_BASE_URL}/v2/lists/check-membership`,
      headers: { Authorization: `Bearer ${context.auth.secret_text}` },
      body: {
        entity_ids: ids,
        entity_type,
      },
    });
    return response.body;
  },
});
