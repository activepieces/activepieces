import {
  PiecePropValueSchema,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { drupalAuth } from '../auth';
import { drupal } from '../common/jsonapi';
import { fetchEntityTypesForReading } from '../common/drupal-entities';

export const drupalGetEntityAction = createAction({
  auth: drupalAuth,
  name: 'drupal-get-entity',
  classification: 'READ',
  displayName: 'Get Entity',
  description: 'Get one Drupal entity by its UUID.',
  audience: 'both',
  aiMetadata: { description: 'Retrieves a single Drupal entity by its entity type, bundle, and UUID via JSON:API. Use when the exact UUID is known; to find entities by criteria use List Entities instead. Read-only and idempotent.', idempotent: true },
  propertyGroups: [
    { key: 'item', display: 'section', label: 'Entity to Get', icon: 'tag', props: ['entity_type', 'entity_uuid'] },
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

    return await drupal.getEntity(
      auth,
      entityInfo.entity_type,
      entityInfo.bundle,
      propsValue.entity_uuid
    );
  },
});