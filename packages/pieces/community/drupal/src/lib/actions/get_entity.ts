import {
  PiecePropValueSchema,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { drupalAuth } from '../../';
import { drupal } from '../common/jsonapi';
import { fetchEntityTypesForReading } from '../common/drupal-entities';

type DrupalAuthType = PiecePropValueSchema<typeof drupalAuth>;

export const drupalGetEntityAction = createAction({
  auth: drupalAuth,
  name: 'drupal-get-entity',
  displayName: 'Get Entity',
  description: 'Retrieve a single entity by UUID',
  props: {
    entity_type: Property.Dropdown({
      displayName: 'Entity Type',
      description: 'Choose the type of content to retrieve.',
      required: true,
      refreshers: [],
      auth: drupalAuth,
      options: async ({ auth }) => fetchEntityTypesForReading(auth),
    }),
    entity_uuid: Property.ShortText({
      displayName: 'Entity UUID',
      description: 'The unique identifier (UUID) of the specific content item to retrieve.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const entityInfo = propsValue.entity_type as any;
    
    return await drupal.getEntity(
      auth,
      entityInfo.entity_type,
      entityInfo.bundle,
      propsValue.entity_uuid
    );
  },
});