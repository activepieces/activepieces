import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { freshsalesAuth } from '../auth';
import { freshsalesClient } from '../common/client';
import { freshsalesRecords } from '../common/records';
import { dealOutputSchema } from '../output-schemas';

export const getDeal = createAction({
  auth: freshsalesAuth,
  name: 'get_deal',
  displayName: 'Get Deal',
  description: 'Get a deal by its ID',
  audience: 'both',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fetches one Freshsales deal by numeric ID, including amount, pipeline, stage and owner IDs. Fails with a not-found error if the ID does not exist. Use Search Records to find a deal ID by name.',
    idempotent: true,
  },
  outputSchema: dealOutputSchema,
  props: {
    deal_id: Property.ShortText({
      displayName: 'Deal ID',
      description: 'ID of the deal to fetch',
      placeholder: '16000123456',
      required: true,
    }),
  },
  async run(context) {
    const id = freshsalesClient.requireId({ value: context.propsValue.deal_id, field: 'Deal ID' });
    const response = await freshsalesClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/api/deals/${id}`,
      query: { include: freshsalesRecords.RECORD_INCLUDES.deals },
    });
    return freshsalesRecords.shapeDeal(freshsalesClient.unwrap({ body: response, key: 'deal' }));
  },
});
