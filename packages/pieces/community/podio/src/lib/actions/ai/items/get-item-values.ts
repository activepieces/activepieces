import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetItemValuesOutputSchema } from '../../../output-schemas';

export const getItemValuesAction = createAction({
  auth: podioAuth,
  name: 'podio_get_item_values',
  outputSchema: podioGetItemValuesOutputSchema,
  displayName: 'Get Item Values',
  description: 'Gets the values of every field on an item.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads the values of every non-empty field on an item, each with its field id, type and label, without the comments, files and other data Get Item returns. Use Get Item Field Values for a single field. The item id comes from Filter Items or Get Item.',
    idempotent: true,
  },
  props: {
    itemId: podioAiProps.id({ required: true, displayName: 'Item ID', description: 'The id of the item, from Filter Items, Get Item or Create Item.' }),
  },
  async run({ auth, propsValue }) {
    const fields = await podioClient.request<unknown[]>({ auth, method: HttpMethod.GET, path: `/item/${propsValue.itemId}/value` });
    return { fields, count: fields.length };
  },
});
