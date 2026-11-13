import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { campaignMonitorAuth } from '../auth';
import { clientId, listId } from '../common/props';
import { subscriptionResultOutputSchema } from '../output-schemas';

export const deleteSubscriberAction = createAction({
  auth: campaignMonitorAuth,
  name: 'delete_subscriber',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Subscriber',
  description: 'Moves a subscriber to the Deleted state of a list.',
  audience: 'both',
  aiMetadata: {
    description:
      'Deletes a subscriber, identified by email, from a Campaign Monitor list: they move to the Deleted state and will not receive any further sends to that list, but can be added again later. Choose Unsubscribe Subscriber instead to record an opt-out. Idempotent: deleting an email that was already deleted succeeds again with no change.',
    idempotent: true,
  },
  outputSchema: subscriptionResultOutputSchema,
  props: {
    clientId: clientId,
    listId: listId,
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'The email address of the subscriber to delete.',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const { listId, email } = propsValue;
    await makeRequest({
      auth: { apiKey: auth.secret_text },
      method: HttpMethod.DELETE,
      path: `/subscribers/${listId}.json?email=${encodeURIComponent(email)}`,
    });
    return {
      success: true,
      emailAddress: email,
      listId,
    };
  },
});
