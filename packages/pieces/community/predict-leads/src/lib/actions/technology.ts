import {
  PiecePropValueSchema,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { limitField, makeClient, pageField } from '../common';
import { PredictLeadsAuth } from '../../index';
import { prepareQuery } from '../common/client';

export const findTechnologiesAction = createAction({
  auth: PredictLeadsAuth,
  name: 'predict-leads_find_technologies',
  displayName: 'List Technologies',
  description: 'Retrieves all tracked technologies',
  props: {
    order_by: Property.StaticDropdown({
      displayName: 'Order By',
      required: false,
      options: {
        options: [
          { value: 'created_at_asc', label: 'Created At - Ascending' },
          { value: 'created_at_desc', label: 'Created At - Descending' },
        ]
      }
    }),
    page: pageField,
    limit: limitField,
  },
  async run(context) {
    const page = context.propsValue.page ?? 1;
    const limit = context.propsValue.limit ?? 1000;
    const order_by = context.propsValue.order_by ?? undefined;

    const client = makeClient(
      context.auth as PiecePropValueSchema<typeof PredictLeadsAuth>
    );

    try {
      const response = await client.findTechnologies(
        prepareQuery({
          order_by,
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

export const findTechnologyByIdAction = createAction({
  auth: PredictLeadsAuth,
  name: 'predict-leads_find_technology_by_id',
  displayName: 'Get Technology',
  description: 'Retrieves a single technology by ID.',
  props: {
    id: Property.ShortText({
      displayName: 'ID',
      description: 'The ID of the technology to find.',
      required: true,
    }),
  },
  async run(context) {
    const id = context.propsValue.id;

    const client = makeClient(
      context.auth as PiecePropValueSchema<typeof PredictLeadsAuth>
    );

    try {
      const response = await client.findTechnologyById(id);
      return response;
    } catch (error) {
      throw new Error(JSON.stringify(error, undefined, 2));
    }
  },
});

