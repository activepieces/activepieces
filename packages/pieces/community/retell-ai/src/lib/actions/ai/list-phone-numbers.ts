import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { retellAiProps } from '../../common/ai-props';
import { retellAiAuth } from '../../common/auth';
import { apiKeyOf, retellApiCall } from '../../common/client';
import { retellInput } from '../../common/input';
import { retellMap } from '../../common/mappers';
import { retellSchemas } from '../../common/schemas';
export const listPhoneNumbersAction = createAction({
  auth: retellAiAuth,
  name: 'list_phone_numbers',
  classification: 'SEARCH',
  displayName: 'List Phone Numbers',
  description: 'Lists the phone numbers in the workspace.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the Retell phone numbers of the workspace with nickname and bound inbound/outbound agents. Use it to pick a From Number for calls or SMS. Pass pagination_key for the next page. Read-only.',
    idempotent: true,
  },
  props: {
    limit: retellAiProps.limit(),
    pagination_key: retellAiProps.paginationKey(),
  },
  outputSchema: retellSchemas.phoneNumberPage,
  async run({ auth, propsValue }) {
    const response = await retellApiCall({
      apiKey: apiKeyOf(auth),
      method: HttpMethod.GET,
      path: '/v2/list-phone-numbers',
      query: {
        limit: retellInput.pageLimit(propsValue.limit),
        pagination_key: retellInput.optionalText(propsValue.pagination_key),
      },
      retryRateLimit: true,
    });
    return retellMap.page({ body: response, mapItem: retellMap.phoneNumber });
  },
});
