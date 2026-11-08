import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioRearrangeItemOutputSchema } from '../../../output-schemas';

export const rearrangeItemAction = createAction({
  auth: podioAuth,
  name: 'podio_rearrange_item',
  outputSchema: podioRearrangeItemOutputSchema,
  displayName: 'Rearrange Item',
  description: 'Moves an item card: changes the field it is grouped by and/or its position among other items.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Moves an item like dragging its card in Podio\'s card view: changes the grouping field values (from/to) and/or places it above or below another item. Set Values, Above Item ID or Below Item ID. For other field changes use Update Item. Item ids come from Filter Items; field ids from Get App.',
    idempotent: true,
  },
  props: {
    itemId: podioAiProps.id({ required: true, displayName: 'Item ID', description: 'The id of the item to move, from Filter Items or Get Item.' }),
    values: podioAiProps.json({
      required: false,
      displayName: 'Values',
      description: 'The field changes keyed by field id, e.g. {"456": {"from": 1, "to": 2}} to move the card from category option 1 to option 2.',
    }),
    belowItemId: podioAiProps.id({ required: false, displayName: 'Below Item ID', description: 'The id of the item that should end up below this item, from Filter Items.' }),
    aboveItemId: podioAiProps.id({ required: false, displayName: 'Above Item ID', description: 'The id of the item that should end up above this item, from Filter Items.' }),
  },
  async run({ auth, propsValue }) {
    const values = propsValue.values && Object.keys(propsValue.values).length > 0 ? propsValue.values : undefined;
    const priority = propsValue.belowItemId || propsValue.aboveItemId
      ? podioUtils.body({
        values: {
          below: propsValue.belowItemId ? Number(propsValue.belowItemId) : undefined,
          above: propsValue.aboveItemId ? Number(propsValue.aboveItemId) : undefined,
        },
      })
      : undefined;
    if (!values && !priority) {
      throw new Error('Set Values, Below Item ID or Above Item ID.');
    }
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.POST,
      path: `/item/${propsValue.itemId}/rearrange`,
      body: podioUtils.body({ values: { values, priority } }),
    });
  },
});
