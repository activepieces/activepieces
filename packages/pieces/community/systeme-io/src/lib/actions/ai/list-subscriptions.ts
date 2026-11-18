import { createAction, Property } from '@activepieces/pieces-framework';
import { systemeIoAuth } from '../../common/auth';
import { systemeIoInput } from '../../common/client';
import { subscriptionRow } from '../../common/mappers';
import { aiListSubscriptionsOutputSchema } from '../../output-schemas-ai';
import { aiCommon } from './common';

export const systemeListSubscriptions = createAction({
  auth: systemeIoAuth,
  name: 'systeme_list_subscriptions',
  classification: 'SEARCH',
  displayName: 'List Subscriptions',
  description: "List a contact's subscriptions",
  audience: 'ai',
  aiMetadata: {
    description:
      "Lists one Systeme.io contact's subscriptions with status (active, cancelled, completed, in_charge, incomplete, incomplete_expired), dates and price plan. Use to find the subscription_id for cancel_subscription or to check whether a contact still pays. A contact_id is required. Read-only and idempotent.",
    idempotent: true,
  },
  props: {
    contact_id: Property.ShortText({
      displayName: 'Contact ID',
      description: 'Numeric contact id, e.g. "12345" (from find_contacts, findContactByEmail or a sale trigger\'s customer.contactId).',
      required: true,
    }),
    max_results: aiCommon.maxResultsProp,
    starting_after: aiCommon.startingAfterProp,
  },
  outputSchema: aiListSubscriptionsOutputSchema,
  async run(context) {
    const p = context.propsValue;
    const contact = systemeIoInput.requireId({ value: p.contact_id, name: 'contact_id' });
    const result = await aiCommon.list({
      apiKey: context.auth.secret_text,
      url: '/payment/subscriptions',
      query: { contact },
      maxResults: p.max_results,
      startingAfter: p.starting_after,
      map: subscriptionRow,
    });
    return { subscriptions: result.items, count: result.count, has_more: result.has_more, next_cursor: result.next_cursor };
  },
});
