import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioUpdateItemOutputSchema } from '../../../output-schemas';

export const updateItemFieldValuesAction = createAction({
  auth: podioAuth,
  name: 'podio_update_item_field_values',
  outputSchema: podioUpdateItemOutputSchema,
  displayName: 'Update Item Field Values',
  description: 'Sets the values of one field on an item.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Replaces the values of one field on an item; [] clears the field. Use Update Item Values or Update Item to change several fields at once. The item id comes from Filter Items or Get Item; the field id or external id and option ids from Get App.',
    idempotent: true,
  },
  props: {
    itemId: podioAiProps.id({ required: true, displayName: 'Item ID', description: 'The id of the item, from Filter Items, Get Item or Create Item.' }),
    fieldOrExternalId: podioAiProps.text({ required: true, displayName: 'Field ID or External ID', description: 'The field id or the field external id, from Get App.' }),
    values: podioAiProps.json({
      required: true,
      displayName: 'Values',
      description: 'The new values in the Create Item field format: a value, a sub-value object or a list, e.g. [1, 3] for category options 1 and 3, {"start": "2026-11-04"} for a date, or [] to clear.',
    }),
    hook: podioAiProps.hook({ required: false }),
    silent: podioAiProps.silent({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.PUT,
      path: `/item/${propsValue.itemId}/value/${encodeURIComponent(propsValue.fieldOrExternalId)}`,
      query: podioUtils.query({ values: { hook: propsValue.hook, silent: propsValue.silent } }),
      body: propsValue.values,
    });
  },
});
