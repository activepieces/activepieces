import {
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { drupalAuth } from '../auth';
import { drupal } from '../common/jsonapi';
import { fetchEntityTypesForReading } from '../common/drupal-entities';

export const drupalDeleteEntityAction = createAction({
  auth: drupalAuth,
  name: 'drupal-delete-entity',
  displayName: 'Delete Entity',
  description: 'Delete an entity from Drupal',
  audience: 'both',
  aiMetadata: { description: 'Permanently deletes a Drupal entity identified by its entity type, bundle, and UUID via JSON:API. Use to remove known content. Not idempotent: the first call deletes the entity and a repeat call for the same UUID fails because the resource no longer exists.', idempotent: false },
  props: {
    entity_type: Property.Dropdown({
      displayName: 'Entity Type',
      description: 'Choose the type of content to delete.',
      required: true,
      refreshers: [],
      auth: drupalAuth,
      options: async ({ auth }) => fetchEntityTypesForReading(auth),
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
      auth,
      entityInfo.entity_type,
      entityInfo.bundle,
      propsValue.entity_uuid
    );
  },
});