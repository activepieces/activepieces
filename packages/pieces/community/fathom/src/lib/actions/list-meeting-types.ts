import { createAction, Property } from '@activepieces/pieces-framework';
import { fathomAuth } from '../common/auth';
import { fathomClient } from '../common/client';
import { fathomOutputSchemas } from '../output-schemas';

export const listMeetingTypes = createAction({
  name: 'list_meeting_types',
  classification: 'SEARCH',
  displayName: 'List Meeting Types',
  description: 'List the meeting types defined in your Fathom organization.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists the meeting types defined in the Fathom org (name, active/inactive, created date), optionally only active or only inactive ones. Use to get the exact name for the meeting_type filter of List Meetings; an unknown name there returns nothing. Read-only and idempotent.',
    idempotent: true,
  },
  auth: fathomAuth,
  props: {
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Active types can be assigned to new meetings; inactive ones only appear on older meetings.',
      required: false,
      defaultValue: 'all',
      options: {
        options: [
          { label: 'All', value: 'all' },
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
        ],
      },
    }),
  },
  outputSchema: fathomOutputSchemas.meetingTypes,
  async run({ auth, propsValue }) {
    const result = await fathomClient.listPages({ auth, path: 'meeting_types', maxPages: MAX_PAGES });
    if (result.truncated) {
      throw new Error(`Fathom returned more than ${MAX_PAGES} pages of meeting types; this action stopped instead of returning a partial list.`);
    }
    const status = propsValue.status;
    const items = status === 'active' || status === 'inactive' ? result.items.filter((item) => item['status'] === status) : result.items;
    return { items, count: items.length };
  },
});

const MAX_PAGES = 20;
