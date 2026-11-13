import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { convertkitAuth } from '../../auth';
import { kitClient, kitCommon } from '../../common/client';
import { kitProps } from '../../common/ai-props';
import { Subscription } from '../../common/types';
import { kitListTagSubscriptionsOutputSchema } from '../../output-schemas';

export const kitListSequenceSubscriptions = createAction({
  auth: convertkitAuth,
  name: 'kit_list_sequence_subscriptions',
  classification: 'SEARCH',
  outputSchema: kitListTagSubscriptionsOutputSchema,
  displayName: 'List Sequence Subscriptions',
  description: 'List the subscribers enrolled in a sequence, 50 per page.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the subscribers enrolled in one sequence, each with the subscriber record, 50 per page, with total counts for paging. Filter by active or cancelled state. Get the sequence ID from List Sequences.',
    idempotent: true,
  },
  props: {
    sequence_id: kitProps.id('Sequence ID', 'The sequence ID, from List Sequences.'),
    page: kitProps.page('Page number, 50 subscriptions per page. Defaults to 1.'),
    sort_order: kitProps.sortOrder('Sort by enrollment date. Kit defaults to ascending (oldest first).'),
    subscriber_state: kitProps.subscriberState,
  },
  async run(context) {
    const { sequence_id, page, sort_order, subscriber_state } = context.propsValue;
    const response = await kitClient.request<{
      subscriptions: Subscription[];
      page: number;
      total_pages: number;
      total_subscriptions: number;
    }>({
      apiSecret: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/sequences/${kitCommon.id({ value: sequence_id, label: 'Sequence ID' })}/subscriptions`,
      query: { page: kitCommon.page(page), sort_order, subscriber_state },
    });
    return {
      subscriptions: response.body.subscriptions ?? [],
      page: response.body.page,
      total_pages: response.body.total_pages,
      total_subscriptions: response.body.total_subscriptions,
    };
  },
});
