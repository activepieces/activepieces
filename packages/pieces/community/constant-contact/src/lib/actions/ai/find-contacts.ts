import { createAction } from '@activepieces/pieces-framework';
import { constantContactAuth } from '../../auth';
import { CONTACT_INCLUDE, ccClient } from '../../common/client';
import { aiInput, aiProps } from '../../common/ai-props';
import { ccInput } from '../../common/props';
import { ccData } from '../../common/types';
import { findContactsOutputSchema } from '../../common/output-schemas';

export const findContactsAiAction = createAction({
  auth: constantContactAuth,
  name: 'find_contacts_ai',
  classification: 'SEARCH',
  displayName: 'Find Contacts',
  description: 'Searches contacts by email, list, tag, status or date.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches Constant Contact contacts by exact email, list IDs, tag IDs, status (active, unsubscribed, deleted, all, ...) and created/updated date ranges, returning full contacts one page at a time. Deleted contacts are excluded unless status includes deleted or all. Pass next_cursor with the same filters for the next page.',
    idempotent: true,
  },
  outputSchema: findContactsOutputSchema,
  props: {
    email: aiProps.text({ displayName: 'Email', description: 'Exact email address.' }),
    list_ids: aiProps.text({ displayName: 'List IDs', description: 'Comma-separated list IDs (up to 25); returns members of any of them.' }),
    tag_ids: aiProps.text({ displayName: 'Tag IDs', description: 'Comma-separated tag IDs (up to 50).' }),
    status: aiProps.text({
      displayName: 'Status',
      description: 'Comma-separated: all, active, deleted, not_set, pending_confirmation, temp_hold, unsubscribed. Default: every status except deleted.',
    }),
    created_after: aiProps.text({ displayName: 'Created After', description: 'ISO 8601 date or date-time.' }),
    created_before: aiProps.text({ displayName: 'Created Before', description: 'ISO 8601 date or date-time.' }),
    updated_after: aiProps.text({ displayName: 'Updated After', description: 'ISO 8601 date or date-time.' }),
    updated_before: aiProps.text({ displayName: 'Updated Before', description: 'ISO 8601 date or date-time.' }),
    include_count: aiProps.yesNo({ displayName: 'Include Total Count', description: 'yes to also return contacts_count, the total number of matches.' }),
    limit: aiProps.limit({ max: 500, fallback: 50 }),
    cursor: aiProps.cursor(),
  },
  async run({ auth, propsValue }) {
    const statuses = ccInput.textList(propsValue.status).map((status) => status.toLowerCase());
    const invalid = statuses.find((status) => !CONTACT_STATUSES.includes(status));
    if (invalid !== undefined) {
      throw new Error(`Status "${invalid.slice(0, 30)}" is not valid. Use ${CONTACT_STATUSES.join(', ')}.`);
    }
    const listIds = ccInput.idList({ value: propsValue.list_ids, label: 'List IDs', max: 25, required: false });
    const tagIds = ccInput.idList({ value: propsValue.tag_ids, label: 'Tag IDs', max: 50, required: false });
    const page = await ccClient.listPage({
      accessToken: auth.access_token,
      path: '/contacts',
      key: 'contacts',
      operation: 'find contacts',
      query: {
        email: ccInput.optionalText(propsValue.email),
        lists: listIds.join(','),
        tags: tagIds.join(','),
        status: statuses.join(','),
        created_after: aiInput.isoDateTime({ value: propsValue.created_after, label: 'Created After' }),
        created_before: aiInput.isoDateTime({ value: propsValue.created_before, label: 'Created Before' }),
        updated_after: aiInput.isoDateTime({ value: propsValue.updated_after, label: 'Updated After' }),
        updated_before: aiInput.isoDateTime({ value: propsValue.updated_before, label: 'Updated Before' }),
        include: CONTACT_INCLUDE,
        include_count: aiInput.yesNo({ value: propsValue.include_count, label: 'Include Total Count' }),
        limit: aiInput.limit({ value: propsValue.limit, max: 500, fallback: 50 }),
        cursor: aiInput.cursor(propsValue.cursor),
      },
    });
    const count = ccData.numberAt({ value: page.body, key: 'contacts_count' });
    return { contacts: page.items, ...(count === undefined ? {} : { contacts_count: count }), next_cursor: page.nextCursor };
  },
});

const CONTACT_STATUSES = ['all', 'active', 'deleted', 'not_set', 'pending_confirmation', 'temp_hold', 'unsubscribed'];
