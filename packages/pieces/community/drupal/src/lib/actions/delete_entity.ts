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
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Entity',
  description: 'Permanently delete a Drupal entity by its UUID.',
  audience: 'both',
  aiMetadata: { description: 'Permanently deletes a Drupal entity identified by its entity type, bundle, and UUID via JSON:API. Use to remove known content. Not idempotent: the first call deletes the entity and a repeat call for the same UUID fails because the resource no longer exists.', idempotent: false },
  propertyGroups: [
    { key: 'item', display: 'section', label: 'Entity to Delete', icon: 'trash', props: ['entity_type', 'entity_uuid'] },
  ],
  props: {
    entity_type: Property.Dropdown({
      displayName: 'Entity Type',
      description: 'The kind of entity, shown as bundle (entity type).',
      required: true,
      refreshers: [],
      auth: drupalAuth,
      options: async ({ auth }) => fetchEntityTypesForReading(auth),
    }),
    entity_uuid: Property.ShortText({
      displayName: 'Entity UUID',
      description: 'Find it in the entity\'s JSON:API URL or a List Entities result.',
      placeholder: '3f1c9a52-7b0e-4c1d-9a8e-2f6b1d4c5e7a',
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