import { createAction, Property } from '@activepieces/pieces-framework';
import { closeAuth } from '../../auth';
import { closeClient } from '../../common/client';
import { closeMappers } from '../../common/mappers';
import { closeOutputSchemas } from '../../common/output-schemas';

const VIEW_TYPES = ['lead', 'contact', 'opportunity', 'call', 'email', 'sms', 'meeting', 'note', 'whatsapp_message', 'custom_activity', 'form_submission'];

function smartView(raw: unknown) {
  const v = closeMappers.recordOf(raw);
  return {
    id: closeMappers.str(v['id']),
    name: closeMappers.str(v['name']),
    type: closeMappers.str(v['type']),
    description: closeMappers.str(v['description']),
    isShared: v['is_shared'] === true,
    userId: closeMappers.str(v['user_id']),
    dateCreated: closeMappers.str(v['date_created']),
    dateUpdated: closeMappers.str(v['date_updated']),
  };
}

export const listSmartViews = createAction({
  auth: closeAuth,
  name: 'list_smart_views',
  classification: 'SEARCH',
  displayName: 'List Smart Views',
  description: 'List saved Smart Views.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists Close Smart Views (saved searches) of one type, lead by default (also contact, opportunity, call, email, sms, meeting, note, whatsapp_message, custom_activity, form_submission). Returns id (save_...), name, type, description, whether it is shared and the owner user id. Paged with limit (1-100) and skip (use nextSkip). Read-only.',
    idempotent: true,
  },
  outputSchema: closeOutputSchemas.offsetPage({
    itemsLabel: 'Smart Views',
    labelKey: 'name',
    items: [
      { key: 'id', label: 'Smart View ID' },
      { key: 'name', label: 'Name' },
      { key: 'type', label: 'Type' },
      { key: 'description', label: 'Description' },
      { key: 'isShared', label: 'Shared', format: 'boolean' },
      { key: 'userId', label: 'Owner User ID' },
      { key: 'dateCreated', label: 'Created', format: 'datetime' },
      { key: 'dateUpdated', label: 'Updated', format: 'datetime' },
    ],
  }),
  props: {
    type: Property.StaticDropdown({
      displayName: 'Type',
      required: false,
      defaultValue: 'lead',
      options: { options: VIEW_TYPES.map((value) => ({ label: value, value })) },
    }),
    limit: Property.Number({ displayName: 'Limit', description: '1-100, default 100', required: false }),
    skip: Property.Number({ displayName: 'Skip', description: 'Use nextSkip from the previous call.', required: false }),
  },
  async run({ auth, propsValue }) {
    const type = closeClient.optionalText(propsValue.type) ?? 'lead';
    if (!VIEW_TYPES.includes(type)) throw new Error(`Type must be one of: ${VIEW_TYPES.join(', ')}.`);
    const limit = closeClient.parseInteger({ value: propsValue.limit, label: 'Limit', min: 1, max: 100 });
    const skip = closeClient.parseInteger({ value: propsValue.skip, label: 'Skip', min: 0, max: 1_000_000 });
    const page = await closeClient.listPage({ auth, path: '/saved_search/', query: { type }, limit, skip });
    return closeMappers.offsetPage({ ...page, map: smartView });
  },
});
