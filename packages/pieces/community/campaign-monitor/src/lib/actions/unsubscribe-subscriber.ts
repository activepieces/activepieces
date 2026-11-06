import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { subscriptionResultOutputSchema } from '../output-schemas';
import { campaignMonitorAuth } from '../auth';
import { clientId, listId } from '../common/props';

export const unsubscribeSubscriberAction = createAction({
  auth: campaignMonitorAuth,
  name: 'unsubscribe_subscriber',
  classification: 'DESTRUCTIVE',
  displayName: 'Unsubscribe Subscriber',
  description: 'Remove a subscriber from a list.',
  outputSchema: subscriptionResultOutputSchema,
  audience: 'both',
  aiMetadata: {
    description:
      'Unsubscribes a subscriber, identified by email, from a specific Campaign Monitor list under a client, marking them as opted out. Choose this to record an opt-out and suppress further sends on that list; use Delete Subscriber instead to remove the contact without recording an opt-out. Not idempotent: calling it again for an email that is already unsubscribed, or not on the list, fails with Campaign Monitor error 203.',
    idempotent: false,
  },
  props: {
    clientId: clientId,
    listId: listId,
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'The email address of the subscriber to unsubscribe.',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const { listId, email } = propsValue;

    const payload = {
      EmailAddress: email,
    };

    await makeRequest({
      auth: { apiKey: auth.secret_text },
      method: HttpMethod.POST,
      path: `/subscribers/${listId}/unsubscribe.json`,
      body: payload,
    });

    return {
      success: true,
      emailAddress: email,
      listId,
    };
  },
});
