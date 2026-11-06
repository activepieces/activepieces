import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';

export const createTagsAction = createAction({
  auth: podioAuth,
  name: 'podio_create_tags',
  displayName: 'Create Tags',
  description: 'Adds tags to an object, keeping the tags it already has.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Adds tags to a Podio object such as an item or status; existing tags stay and a tag already on the object is ignored. Use Update Tags to replace the whole set and Remove Tag to take one off. Item ids come from Filter Items.',
    idempotent: true,
  },
  props: {
    refType: podioAiProps.text({ required: true, displayName: 'Object Type', description: 'The type of the tagged object, such as "item" or "status".' }),
    refId: podioAiProps.id({ required: true, displayName: 'Object ID', description: 'The id of the object, such as an item id from Filter Items or a status id from Get Status.' }),
    tags: podioAiProps.idList({ required: true, displayName: 'Tags', description: 'The texts of the tags to add.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.POST,
      path: `/tag/${propsValue.refType}/${propsValue.refId}/`,
      body: propsValue.tags,
    });
  },
});
