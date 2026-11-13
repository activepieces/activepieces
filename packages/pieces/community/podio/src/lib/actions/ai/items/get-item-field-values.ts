import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetItemFieldValuesOutputSchema } from '../../../output-schemas';

export const getItemFieldValuesAction = createAction({
  auth: podioAuth,
  name: 'podio_get_item_field_values',
  outputSchema: podioGetItemFieldValuesOutputSchema,
  displayName: 'Get Item Field Values',
  description: 'Gets the values of one field on an item.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads the values of one field on one item; values is null when the field is empty. Use Get Item Values for every field at once. The item id comes from Filter Items or Get Item; the field id or external id from Get App.',
    idempotent: true,
  },
  props: {
    itemId: podioAiProps.id({ required: true, displayName: 'Item ID', description: 'The id of the item, from Filter Items, Get Item or Create Item.' }),
    fieldOrExternalId: podioAiProps.text({ required: true, displayName: 'Field ID or External ID', description: 'The field id or the field external id, from Get App.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: `/item/${propsValue.itemId}/value/${encodeURIComponent(propsValue.fieldOrExternalId)}/v2` });
  },
});
