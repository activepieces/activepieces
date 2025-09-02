import {
  PiecePropValueSchema,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { limitField, makeClient, pageField } from '../common';
import { PredictLeadsAuth } from '../../index';
import { prepareQuery } from '../common/client';

export const findCompaniesAction = createAction({
  auth: PredictLeadsAuth,
  name: 'predict-leads_find_companies',
  displayName: 'List Companies',
  description: 'Retrieves all companies.',
  props: {
    location: Property.ShortText({
      displayName: 'Location',
      required: true,
    }),
    minMaxSizes: Property.ShortText({
      displayName: 'Min Max Size',
      description:
        'A min-max size range. Examples: "11-50"". For now, only single range is supported.',
      required: true,
    }),
    page: pageField,
    limit: limitField,
  },
  async run(context) {
    const page = context.propsValue.page ?? 1;
    const limit = context.propsValue.limit ?? 1000;
    const location = context.propsValue.location;
    const min_max_sizes = context.propsValue.minMaxSizes;

    const client = makeClient(
      context.auth as PiecePropValueSchema<typeof PredictLeadsAuth>
    );

    try {
      const response = await client.findCompanies(
        prepareQuery({
          location,
          min_max_sizes,
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

export const findCompanyByDomainAction = createAction({
  auth: PredictLeadsAuth,
  name: 'predict-leads_find_company_by_domain',
  displayName: 'Retrieve a company',
  description: 'Retrieves a company by its domain.',
  props: {
    domain: Property.ShortText({
      displayName: 'Domain',
      description: 'The domain of the company to find.',
      required: true,
    }),
  },
  async run(context) {
    const domain = context.propsValue.domain;

    const client = makeClient(
      context.auth as PiecePropValueSchema<typeof PredictLeadsAuth>
    );

    try {
      const response = await client.findCompanyByDomain(domain);
      return response;
    } catch (error) {
      throw new Error(JSON.stringify(error, undefined, 2));
    }
  },
});

