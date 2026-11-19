import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { postizAuth } from '../common/auth';
import { mapPost, postizApiCall, PostizPost, postOutputFields } from '../common';
import { parseDate } from '../common/post-body';

export const listPosts = createAction({
  auth: postizAuth,
  name: 'list_posts',
  classification: 'SEARCH',
  displayName: 'List Posts',
  description: 'Retrieve posts within a date range',
  audience: 'both',
  aiMetadata: {
    description: 'Retrieves posts scheduled, drafted or published within a given date range across all connected channels, optionally for one customer. Use to inspect what is on the calendar or to obtain post IDs for analytics, status changes or deletion. Both start and end dates are required (ISO 8601). Idempotent: a read-only lookup.',
    idempotent: true,
  },
  outputSchema: {
    itemLabel: '{integration_name}: {publish_date}',
    fields: [
      {
        key: 'posts',
        label: 'Posts',
        value: '',
        labelKey: 'id',
        listItems: postOutputFields,
      },
    ],
  },
  props: {
    startDate: Property.DateTime({
      displayName: 'Start Date',
      description: 'Start of the date range.',
      required: true,
    }),
    endDate: Property.DateTime({
      displayName: 'End Date',
      description: 'End of the date range.',
      required: true,
    }),
    customer: Property.ShortText({
      displayName: 'Customer ID',
      description: 'Only return posts of this Postiz customer.',
      required: false,
    }),
  },
  async run(context) {
    const startDate = parseDate({ value: context.propsValue.startDate, label: 'Start Date' });
    const endDate = parseDate({ value: context.propsValue.endDate, label: 'End Date' });
    if (startDate === undefined || endDate === undefined) {
      throw new Error('Start Date and End Date are required.');
    }
    if (new Date(startDate).getTime() > new Date(endDate).getTime()) {
      throw new Error('Start Date must be before End Date.');
    }
    const queryParams: Record<string, string> = { startDate, endDate };
    const customer = context.propsValue.customer?.trim();
    if (customer) {
      queryParams['customer'] = customer;
    }

    const response = await postizApiCall<{ posts?: PostizPost[] }>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/posts',
      queryParams,
    });

    return (response.body?.posts ?? []).map((post) => mapPost({ post }));
  },
});
