import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../common/auth';
import { villageApi } from '../../common/client';
import { villageSchemas } from '../../common/schemas';

const MAX_ENTITY_IDS = 1000;

export const checkListMembership = createAction({
  auth: villageAuth,
  name: 'check_list_membership',
  classification: 'SEARCH',
  displayName: 'Check list membership',
  description:
    'Check which lists contain the given entities. Returns a map of entity_id to the lists that contain it. Entities not in any list are omitted.',
  audience: 'both',
  aiMetadata: {
    description:
      'For up to 1000 entity IDs (all people or all companies), look up which lists each one belongs to. Read-only and idempotent despite using POST. Use to reverse the list-to-members relationship — finding an entity\'s memberships rather than reading a list\'s contents.',
    idempotent: true,
  },
  outputSchema: villageSchemas.checkListMembership,
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

    const ids = villageApi.stringList(entity_ids);
    if (ids.length === 0) {
      throw new Error('At least one entity ID is required');
    }
    if (ids.length > MAX_ENTITY_IDS) {
      throw new Error(`Maximum ${MAX_ENTITY_IDS} entity IDs per request`);
    }

    const response = await villageApi.call({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/v2/lists/check-membership`,
      body: {
        entity_ids: ids,
        entity_type,
      },
    });
    return response;
  },
});
