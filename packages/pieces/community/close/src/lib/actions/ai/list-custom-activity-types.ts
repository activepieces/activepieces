import { createAction } from '@activepieces/pieces-framework';
import { closeAuth } from '../../auth';
import { closeClient } from '../../common/client';
import { closeMappers } from '../../common/mappers';
import { closeOutputSchemas } from '../../common/output-schemas';

function activityType(raw: unknown) {
  const t = closeMappers.recordOf(raw);
  return {
    id: closeMappers.str(t['id']),
    name: closeMappers.str(t['name']),
    description: closeMappers.str(t['description']),
    apiCreateOnly: t['api_create_only'] === true,
    isArchived: t['is_archived'] === true,
    fields: closeMappers.arrayOf(t['fields']).map((f) => ({
      ...closeMappers.customField(f),
      required: closeMappers.recordOf(f)['required'] === true,
    })),
  };
}

export const listCustomActivityTypes = createAction({
  auth: closeAuth,
  name: 'list_custom_activity_types',
  classification: 'SEARCH',
  displayName: 'List Custom Activity Types',
  description: 'List the custom activity types defined in Close.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists every custom activity type in the Close organization with id (actitype_...), name, description, whether it is archived or API-only, and its custom fields (id cf_..., name, type, required, choices). Read-only.',
    idempotent: true,
  },
  outputSchema: closeOutputSchemas.offsetPage({
    itemsLabel: 'Custom Activity Types',
    labelKey: 'name',
    items: [
      { key: 'id', label: 'Type ID' },
      { key: 'name', label: 'Name' },
      { key: 'description', label: 'Description' },
      { key: 'apiCreateOnly', label: 'API Only', format: 'boolean' },
      { key: 'isArchived', label: 'Archived', format: 'boolean' },
      {
        key: 'fields',
        label: 'Fields',
        labelKey: 'name',
        listItems: [...closeOutputSchemas.fields.customField, { key: 'required', label: 'Required', format: 'boolean' }],
      },
    ],
  }),
  props: {},
  async run({ auth }) {
    const { items, truncated } = await closeClient.listAll({ auth, path: '/custom_activity/' });
    return closeMappers.offsetPage({ items, hasMore: truncated, nextSkip: null, map: activityType });
  },
});
