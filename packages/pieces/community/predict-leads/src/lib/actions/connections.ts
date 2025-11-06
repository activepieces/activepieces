import {
  PiecePropValueSchema,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { firstSeenAtFromField, firstSeenAtUntilField, lastSeenAtFromField, lastSeenAtUntilField, limitField, makeClient, pageField } from '../common';
import { PredictLeadsAuth } from '../../index';
import { prepareQuery } from '../common/client';

export const findConnectionsByDomainAction = createAction({
  auth: PredictLeadsAuth,
  name: 'predict-leads_find_connections_by_domain',
  displayName: 'Get Company Connections',
  description: 'Retrieves company connections by domain.',
  props: {
    domain: Property.ShortText({
      displayName: 'Domain',
      description: 'The domain to find.',
      required: true,
    }),
    // first_seen_at_from: firstSeenAtFromField,
    // first_seen_at_until: firstSeenAtUntilField,
    page: pageField,
    limit: limitField
  },
  async run(context) {
    const domain = context.propsValue.domain;
    const page = context.propsValue.page ?? 1;
    const limit = context.propsValue.limit ?? 1000;

    const client = makeClient(
      context.auth as PiecePropValueSchema<typeof PredictLeadsAuth>
    );

    try {
      const response = await client.findConnectionsByDomain(domain, prepareQuery({
        page,
        limit,
      }));
      return response;
    } catch (error) {
      throw new Error(JSON.stringify(error, undefined, 2));
    }
  },
});


export const findConnectionsAction = createAction({
  auth: PredictLeadsAuth,
  name: 'predict-leads_find_connections',
  displayName: 'List Connections',
  description: 'Finds all portfolio companies.',
  props: {
    // first_seen_at_from: firstSeenAtFromField,
    // first_seen_at_until: firstSeenAtUntilField,
    // last_seen_at_from: lastSeenAtFromField,
    // last_seen_at_until: lastSeenAtUntilField,
    page: pageField,
    limit: limitField
  },
  async run(context) {
    const client = makeClient(
      context.auth as PiecePropValueSchema<typeof PredictLeadsAuth>
    );
    const page = context.propsValue.page ?? 1;
    const limit = context.propsValue.limit ?? 1000;

    try {
      const response = await client.findConnections(prepareQuery({
        page,
        limit,
      }));
      return response;
    } catch (error) {
      throw new Error(JSON.stringify(error, undefined, 2));
    }
  },
});