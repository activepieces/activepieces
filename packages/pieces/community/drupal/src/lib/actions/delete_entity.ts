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

export const drupalDeleteEntityAction = createAction({
  auth: drupalAuth,
  name: 'drupal-delete-entity',
  displayName: 'Delete Entity',
  description: 'Delete an entity from Drupal',
  props: {
    entity_type: Property.Dropdown({
      displayName: 'Entity Type',
      description: 'Choose the type of content to delete.',
      required: true,
      refreshers: [],
      options: async ({ auth }) => fetchEntityTypesForReading(auth as DrupalAuthType),
    }),
    entity_uuid: Property.ShortText({
      displayName: 'Entity UUID',
      description: 'The unique identifier (UUID) of the specific content item to delete.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const entityInfo = propsValue.entity_type as any;
    
    return await drupal.deleteEntity(
      auth as DrupalAuthType,
      entityInfo.entity_type,
      entityInfo.bundle,
      propsValue.entity_uuid
    );
  },
});