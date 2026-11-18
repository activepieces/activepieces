import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';

export const updateTagsAction = createAction({
  auth: podioAuth,
  name: 'podio_update_tags',
  displayName: 'Update Tags',
  description: 'Replaces all tags on an object with the given tags.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Replaces every tag on a Podio object such as an item or status with the given list; tags not in the list are removed. Set Clear All Tags to "true" (with no tags) to remove them all. Use Create Tags to add without removing. Item ids come from Filter Items.',
    idempotent: true,
  },
  props: {
    refType: podioAiProps.text({ required: true, displayName: 'Object Type', description: 'The type of the tagged object, such as "item" or "status".' }),
    refId: podioAiProps.id({ required: true, displayName: 'Object ID', description: 'The id of the object, such as an item id from Filter Items or a status id from Get Status.' }),
    tags: podioAiProps.idList({ required: false, displayName: 'Tags', description: 'The texts of the tags the object should have.' }),
    clearAllTags: podioAiProps.bool({ required: false, displayName: 'Clear All Tags', description: '"true" removes every tag from the object. Cannot be combined with Tags.' }),
  },
  async run({ auth, propsValue }) {
    const tags = propsValue.tags ?? [];
    const clearAll = podioUtils.toBool({ value: propsValue.clearAllTags }) === true;
    if (clearAll && tags.length > 0) {
      throw new Error('Pass either Tags or Clear All Tags "true", not both.');
    }
    if (!clearAll && tags.length === 0) {
      throw new Error('Tags is empty. Pass at least one tag, or set Clear All Tags to "true" to remove every tag.');
    }
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.PUT,
      path: `/tag/${propsValue.refType}/${propsValue.refId}/`,
      body: tags,
    });
  },
});
