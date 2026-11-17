import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioCloneItemOutputSchema } from '../../../output-schemas';

export const cloneItemAction = createAction({
  auth: podioAuth,
  name: 'podio_clone_item',
  outputSchema: podioCloneItemOutputSchema,
  displayName: 'Clone Item',
  description: 'Creates a copy of an item with the same values in the same app.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a new item in the same app with the same field values as the given item and returns its item id. To change values on the copy, read them with Get Item Clone and pass them to Create Item instead. The item id comes from Filter Items or Get Item.',
    idempotent: false,
  },
  props: {
    itemId: podioAiProps.id({ required: true, displayName: 'Item ID', description: 'The id of the item to copy, from Filter Items or Get Item.' }),
    silent: podioAiProps.silent({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.POST,
      path: `/item/${propsValue.itemId}/clone`,
      query: podioUtils.query({ values: { silent: propsValue.silent } }),
    });
  },
});
