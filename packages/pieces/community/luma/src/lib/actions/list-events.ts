import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { lumaAuth } from '../auth';
import { lumaCommon } from '../common';

export const listEventsAction = createAction({
  auth: lumaAuth,
  name: 'list-events',
  displayName: 'List Events',
  description: 'List events from your Luma calendar',
  props: {
    after: Property.DateTime({
      displayName: 'After',
      description: 'Only return events starting after this date',
      required: false,
    }),
    before: Property.DateTime({
      displayName: 'Before',
      description: 'Only return events starting before this date',
      required: false,
    }),
    pagination_limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of events to return (max 50)',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: {
        options: [
          { label: 'Approved', value: 'approved' },
          { label: 'Pending', value: 'pending' },
          { label: 'Rejected', value: 'rejected' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const queryParams: Record<string, string> = {};

    if (propsValue.after) queryParams.after = new Date(propsValue.after).toISOString();
    if (propsValue.before) queryParams.before = new Date(propsValue.before).toISOString();
    if (propsValue.pagination_limit) queryParams.pagination_limit = String(propsValue.pagination_limit);
    if (propsValue.status) queryParams.status = propsValue.status;

    return lumaCommon.makeRequest({
      apiKey: auth,
      method: HttpMethod.GET,
      path: '/calendar/list-events',
      queryParams,
    });
  },
});
