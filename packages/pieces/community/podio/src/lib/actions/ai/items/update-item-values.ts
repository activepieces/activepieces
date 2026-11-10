import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioUpdateItemOutputSchema } from '../../../output-schemas';

export const updateItemValuesAction = createAction({
  auth: podioAuth,
  name: 'podio_update_item_values',
  outputSchema: podioUpdateItemOutputSchema,
  displayName: 'Update Item Values',
  description: 'Sets the values of several fields on an item.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Sets the values of the fields in the map on an item, keyed by field id or external id; [] clears a field. Use Update Item to also change tags, files or the external id, or to guard against conflicting edits with a revision. The item id comes from Filter Items or Get Item; field ids from Get App.',
    idempotent: true,
  },
  props: {
    itemId: podioAiProps.id({ required: true, displayName: 'Item ID', description: 'The id of the item, from Filter Items, Get Item or Create Item.' }),
    fields: podioAiProps.json({
      required: true,
      displayName: 'Fields',
      description: 'The field values keyed by field id or field external id, in the Create Item format, e.g. {"category": [1, 3], "title": "Acme"}.',
    }),
    hook: podioAiProps.hook({ required: false }),
    silent: podioAiProps.silent({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.PUT,
      path: `/item/${propsValue.itemId}/value`,
      query: podioUtils.query({ values: { hook: propsValue.hook, silent: propsValue.silent } }),
      body: propsValue.fields,
    });
  },
});
