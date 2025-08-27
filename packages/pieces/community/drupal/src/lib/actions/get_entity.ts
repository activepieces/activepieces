import {
  PiecePropValueSchema,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { drupalAuth } from '../../';
import { fetchEntityTypes, makeEntityRequest } from '../common/entity-utils';

type DrupalAuthType = PiecePropValueSchema<typeof drupalAuth>;

export const drupalGetEntityAction = createAction({
  auth: drupalAuth,
  name: 'drupal-get-entity',
  displayName: 'Get Entity',
  description: 'Retrieve a single entity by ID or UUID',
  props: {
    entity_type: Property.Dropdown({
      displayName: 'Entity Type',
      description: 'The entity type to retrieve.',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        return await fetchEntityTypes(auth as DrupalAuthType);
      },
    }),
    entity_id: Property.ShortText({
      displayName: 'Entity ID or UUID',
      description: 'The ID or UUID of the entity to retrieve',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const requestBody = {
      entity_type: propsValue.entity_type.id,
      entity_id: propsValue.entity_id,
    };

    console.debug('Entity get request', requestBody);
    
    const result = await makeEntityRequest(
      auth as DrupalAuthType,
      `/modeler_api/entity/get`,
      HttpMethod.POST,
      requestBody
    );
    
    console.debug('Entity get call completed', result);

    if (result.status === 200) {
      return result.body;
    } else if (result.status === 404) {
      throw new Error(`Entity not found: ${propsValue.entity_id}`);
    } else if (result.status === 403) {
      throw new Error(`Access denied to entity: ${propsValue.entity_id}`);
    } else {
      throw new Error(`Failed to retrieve entity: ${result.status} - ${JSON.stringify(result.body)}`);
    }
  },
});