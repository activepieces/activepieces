import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { convertkitAuth } from '../../auth';
import { kitClient, kitCommon } from '../../common/client';
import { kitProps } from '../../common/ai-props';
import { Subscriber } from '../../common/types';
import { kitListSubscribersOutputSchema } from '../../output-schemas';

const dateProp = ({
  displayName,
  description,
}: {
  displayName: string;
  description: string;
}) =>
  Property.ShortText({
    displayName,
    description: `${description} Format yyyy-mm-dd.`,
    required: false,
  });

export const kitListSubscribers = createAction({
  auth: convertkitAuth,
  name: 'kit_list_subscribers',
  classification: 'SEARCH',
  outputSchema: kitListSubscribersOutputSchema,
  displayName: 'List Subscribers',
  description: 'List or search subscribers, 50 per page.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists subscribers 50 per page with total counts, optionally filtered by exact email address or created/updated date range. This is also the way to find a subscriber ID from an email. Kit returns active subscribers by default; set Sort Field to cancelled_at to list cancelled ones.',
    idempotent: true,
  },
  props: {
    email_address: Property.ShortText({
      displayName: 'Email Address',
      description: 'Only return the subscriber with this email address.',
      required: false,
    }),
    from: dateProp({
      displayName: 'Created From',
      description: 'Only subscribers added on or after this date.',
    }),
    to: dateProp({
      displayName: 'Created To',
      description: 'Only subscribers added on or before this date.',
    }),
    updated_from: dateProp({
      displayName: 'Updated From',
      description: 'Only subscribers updated after this date.',
    }),
    updated_to: dateProp({
      displayName: 'Updated To',
      description: 'Only subscribers updated before this date.',
    }),
    page: kitProps.page('Page number, 50 subscribers per page. Defaults to 1.'),
    sort_order: kitProps.sortOrder('Sort direction. Kit defaults to ascending.'),
    sort_field: Property.StaticDropdown({
      displayName: 'Sort Field',
      description: 'Set to Cancelled At to list cancelled subscribers, sorted by cancellation date.',
      required: false,
      options: {
        options: [{ label: 'Cancelled At', value: 'cancelled_at' }],
      },
    }),
  },
  async run(context) {
    const props = context.propsValue;
    const page = kitCommon.page(props.page);
    const response = await kitClient.request<{
      subscribers: Subscriber[];
      page: number;
      total_pages: number;
      total_subscribers: number;
    }>({
      apiSecret: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/subscribers',
      query: {
        page,
        email_address:
          props.email_address === undefined || props.email_address === null || props.email_address.trim() === ''
            ? undefined
            : kitCommon.email({ value: props.email_address, label: 'Email Address' }),
        from: kitCommon.toDate(props.from),
        to: kitCommon.toDate(props.to),
        updated_from: kitCommon.toDate(props.updated_from),
        updated_to: kitCommon.toDate(props.updated_to),
        sort_order: props.sort_order,
        sort_field: props.sort_field,
      },
    });
    return {
      subscribers: response.body.subscribers ?? [],
      page: response.body.page ?? page,
      total_pages: response.body.total_pages,
      total_subscribers: response.body.total_subscribers,
    };
  },
});
