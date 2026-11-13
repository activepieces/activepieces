import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';

export const removeTagAction = createAction({
  auth: podioAuth,
  name: 'podio_remove_tag',
  displayName: 'Remove Tag',
  description: 'Removes one tag from an object.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Removes a single tag from a Podio object such as an item or status; the other tags stay. Use Update Tags to replace the whole set. Item ids come from Filter Items.',
    idempotent: false,
  },
  props: {
    refType: podioAiProps.text({ required: true, displayName: 'Object Type', description: 'The type of the tagged object, such as "item" or "status".' }),
    refId: podioAiProps.id({ required: true, displayName: 'Object ID', description: 'The id of the object, such as an item id from Filter Items or a status id from Get Status.' }),
    text: podioAiProps.text({ required: true, displayName: 'Tag', description: 'The text of the tag to remove.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/tag/${propsValue.refType}/${propsValue.refId}/`,
      query: podioUtils.query({ values: { text: propsValue.text } }),
    });
  },
});
