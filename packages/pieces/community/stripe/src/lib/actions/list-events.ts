import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  QueryParams,
} from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

import { eventListOutputSchema } from '../output-schemas';
export const stripeListEvents = createAction({
  name: 'list_events',
  auth: stripeAuth,
  displayName: 'List Events (Agent)',
  description: 'List Stripe account events.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Pages through the account event log (the audit feed of everything that happened), newest first, optionally filtered by event type (e.g. invoice.paid) or created range. Use to investigate what happened to a resource. Read-only and idempotent.",
    idempotent: true,
  },
  props: {
    type: Property.ShortText({
      displayName: 'Type',
      description: 'Filter by event type (e.g., invoice.paid, charge.refunded).',
      required: false,
    }),
    created_after: Property.DateTime({
      displayName: 'Created After',
      required: false,
    }),
    created_before: Property.DateTime({
      displayName: 'Created Before',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number to return (1-100, default 10).',
      required: false,
    }),
  },
  outputSchema: eventListOutputSchema,
  async run(context) {
    const { type, created_after, created_before, limit } = context.propsValue;

    const queryParams: QueryParams = {};
    if (type) queryParams['type'] = type;
    if (limit) queryParams['limit'] = limit.toString();
    if (created_after) {
      queryParams['created[gte]'] = Math.floor(
        new Date(created_after).getTime() / 1000
      ).toString();
    }
    if (created_before) {
      queryParams['created[lte]'] = Math.floor(
        new Date(created_before).getTime() / 1000
      ).toString();
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${stripeCommon.baseUrl}/events`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      queryParams,
    });

    return response.body;
  },
});
