import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import {
  isSubscriberNotFoundError,
  makeRequest,
  transformCustomFields,
} from '../common/client';
import { findSubscriberOutputSchema } from '../output-schemas';
import { campaignMonitorAuth } from '../auth';
import { clientId, listId } from '../common/props';

export const findSubscriberAction = createAction({
  auth: campaignMonitorAuth,
  name: 'find_subscriber',
  classification: 'READ',
  displayName: 'Find Subscriber',
  description: 'Find a subscriber by email in a specific list.',
  outputSchema: findSubscriberOutputSchema,
  audience: 'both',
  aiMetadata: {
    description:
      'Looks up a single subscriber by exact email address within a specific Campaign Monitor list under a client, returning their details and tracking preference. Choose this to check whether a contact exists on a list or to read their state before adding/updating; a missing subscriber resolves as not found rather than an error. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    clientId: clientId,
    listId: listId,
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'The email address of the subscriber to find',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const { listId, email } = propsValue;

    try {
      const response = await makeRequest<
        Record<string, unknown> & {
          CustomFields?: Array<{ Key: string; Value: string }>;
        }
      >({
        auth: { apiKey: auth.secret_text },
        method: HttpMethod.GET,
        path: `/subscribers/${listId}.json?email=${encodeURIComponent(
          email
        )}&includetrackingpreference=true`,
      });

      return {
        found: true,
        result: {
          ...response.body,
          CustomFields: transformCustomFields(response.body.CustomFields),
        },
      };
    } catch (error) {
      if (isSubscriberNotFoundError(error)) {
        return {
          found: false,
          result: null,
        };
      }
      throw error;
    }
  },
});
