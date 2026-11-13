import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { convertkitAuth } from '../../auth';
import { kitClient, kitCommon } from '../../common/client';
import { kitProps } from '../../common/ai-props';
import { Subscription } from '../../common/types';
import { kitListTagSubscriptionsOutputSchema } from '../../output-schemas';

export const kitListFormSubscriptions = createAction({
  auth: convertkitAuth,
  name: 'kit_list_form_subscriptions',
  classification: 'SEARCH',
  outputSchema: kitListTagSubscriptionsOutputSchema,
  displayName: 'List Form Subscriptions',
  description: 'List the subscribers who signed up through a form, 50 per page.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists subscriptions to one form, each with the subscriber record, 50 per page, with total counts for paging. Filter by active or cancelled state. Get the form ID from List Forms.',
    idempotent: true,
  },
  props: {
    form_id: kitProps.id('Form ID', 'The form ID, from List Forms.'),
    page: kitProps.page('Page number, 50 subscriptions per page. Defaults to 1.'),
    sort_order: kitProps.sortOrder('Sort by subscription date. Kit defaults to ascending (oldest first).'),
    subscriber_state: kitProps.subscriberState,
  },
  async run(context) {
    const { form_id, page, sort_order, subscriber_state } = context.propsValue;
    const response = await kitClient.request<{
      subscriptions: Subscription[];
      page: number;
      total_pages: number;
      total_subscriptions: number;
    }>({
      apiSecret: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/forms/${kitCommon.id({ value: form_id, label: 'Form ID' })}/subscriptions`,
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
