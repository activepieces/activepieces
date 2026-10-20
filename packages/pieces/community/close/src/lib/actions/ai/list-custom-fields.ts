import { createAction, Property } from '@activepieces/pieces-framework';
import { closeAuth } from '../../auth';
import { closeClient } from '../../common/client';
import { closeMappers } from '../../common/mappers';
import { closeOutputSchemas } from '../../common/output-schemas';

const OBJECT_TYPES = ['lead', 'contact', 'opportunity', 'activity', 'shared'];

export const listCustomFields = createAction({
  auth: closeAuth,
  name: 'list_custom_fields',
  classification: 'SEARCH',
  displayName: 'List Custom Fields',
  description: 'List the custom fields for leads, contacts, opportunities or activities.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists the custom fields defined for one Close object type (lead, contact, opportunity, activity, or shared fields used across types). Returns id (cf_...), name, type, description, whether it accepts multiple values and its choices. Pass the ids as keys in Custom Fields on create/update actions. Read-only.',
    idempotent: true,
  },
  outputSchema: closeOutputSchemas.customFields,
  props: {
    objectType: Property.StaticDropdown({
      displayName: 'Object Type',
      required: true,
      defaultValue: 'lead',
      options: { options: OBJECT_TYPES.map((value) => ({ label: value, value })) },
    }),
  },
  async run({ auth, propsValue }) {
    const objectType = closeClient.requiredText({ value: propsValue.objectType, label: 'Object Type' });
    if (!OBJECT_TYPES.includes(objectType)) throw new Error(`Object Type must be one of: ${OBJECT_TYPES.join(', ')}.`);
    const { items, truncated } = await closeClient.listAll({ auth, path: `/custom_field/${objectType}/` });
    return closeMappers.offsetPage({ items, hasMore: truncated, nextSkip: null, map: closeMappers.customField });
  },
});
