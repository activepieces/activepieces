import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';

export const getRecalcStatusForFieldAction = createAction({
  auth: podioAuth,
  name: 'podio_get_recalc_status_for_field',
  displayName: 'Get Recalc Status for Field',
  description: 'Gets whether a calculation field on an item is queued for recalculation or done.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads the recalculation status of a calculation field on an item: "Queued" with a null timestamp while pending, or how long ago it finished. The item id comes from Filter Items or Get Item; the field id from Get App.',
    idempotent: true,
  },
  props: {
    itemId: podioAiProps.id({ required: true, displayName: 'Item ID', description: 'The id of the item, from Filter Items, Get Item or Create Item.' }),
    fieldId: podioAiProps.id({ required: true, displayName: 'Field ID', description: 'The id of the calculation field, from Get App.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: `/item/${propsValue.itemId}/field/${propsValue.fieldId}/recalc/status` });
  },
});
