import {
  PiecePropValueSchema,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { firstSeenAtFromField, firstSeenAtUntilField, lastSeenAtFromField, lastSeenAtUntilField, limitField, makeClient, pageField } from '../common';
import { PredictLeadsAuth } from '../../index';
import { prepareQuery } from '../common/client';

export const findTechnologiesByCompanyAction = createAction({
  auth: PredictLeadsAuth,
  name: 'predict-leads_find_technologies_by_domain',
  displayName: 'List Technologies by domain',
  description: 'Retrieve technologies used by specific company',
  props: {
    domain: Property.ShortText({
      displayName: 'Domain',
      description: 'The domain of the company to find.',
      required: true,
    }),
    first_seen_at_from: firstSeenAtFromField,
    first_seen_at_until: firstSeenAtUntilField,
    last_seen_at_from: lastSeenAtFromField,
    last_seen_at_until: lastSeenAtUntilField,
    page: pageField,
    limit: limitField,
  },
  async run(context) {
    const domain = context.propsValue.domain;
    const first_seen_at_from = context.propsValue.first_seen_at_from;
    const first_seen_at_until = context.propsValue.first_seen_at_until;
    const last_seen_at_from = context.propsValue.last_seen_at_from;
    const last_seen_at_until = context.propsValue.last_seen_at_until;
    const page = context.propsValue.page ?? 1;
    const limit = context.propsValue.limit ?? 1000;

    const client = makeClient(
      context.auth as PiecePropValueSchema<typeof PredictLeadsAuth>
    );

    try {
      const response = await client.findTechnologies(
        domain,
        prepareQuery({
          first_seen_at_from,
          first_seen_at_until,
          last_seen_at_from,
          last_seen_at_until,
          page,
          limit,
        })
      );
      return response;
    } catch (error) {
      throw new Error(JSON.stringify(error, undefined, 2));
    }
  },
});

export const findCompaniesByTechnologyIdAction = createAction({
  auth: PredictLeadsAuth,
  name: 'predict-leads_find_companies_by_technology_id',
  displayName: 'Retrieve companies by technology ID',
  description: 'Retrieves company using specific technology ID',
  props: {
    id: Property.ShortText({
      displayName: 'ID',
      description: 'The ID of the technology to find.',
      required: true,
    }),
    first_seen_at_from: firstSeenAtFromField,
    first_seen_at_until: firstSeenAtUntilField,
    last_seen_at_from: lastSeenAtFromField,
    last_seen_at_until: lastSeenAtUntilField,
    page: pageField,
    limit: limitField,
  },
  async run(context) {
    const id = context.propsValue.id;
    const first_seen_at_from = context.propsValue.first_seen_at_from;
    const first_seen_at_until = context.propsValue.first_seen_at_until;
    const last_seen_at_from = context.propsValue.last_seen_at_from;
    const last_seen_at_until = context.propsValue.last_seen_at_until;
    const page = context.propsValue.page ?? 1;
    const limit = context.propsValue.limit ?? 1000;

    const client = makeClient(
      context.auth as PiecePropValueSchema<typeof PredictLeadsAuth>
    );

    try {
      const response = await client.findCompaniesTechnologyById(id,
        prepareQuery({
          first_seen_at_from,
          first_seen_at_until,
          last_seen_at_from,
          last_seen_at_until,
          page,
          limit,
        })
      );
      return response;
    } catch (error) {
      throw new Error(JSON.stringify(error, undefined, 2));
    }
  },
});

