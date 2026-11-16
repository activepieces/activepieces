import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioListCommentsOutputSchema } from '../../../output-schemas';

export const listCommentsAction = createAction({
  auth: podioAuth,
  name: 'podio_list_comments',
  outputSchema: podioListCommentsOutputSchema,
  displayName: 'List Comments',
  description: 'Lists the comments on an item, task, status or other object.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the comments on one Podio object, oldest first, one page at a time with Limit and Offset. The object is chosen by Object Type and Object ID (an item id from the item actions, a task id from List Tasks, a status id from Create Status).',
    idempotent: true,
  },
  props: {
    type: podioAiProps.text({ required: true, displayName: 'Object Type', description: 'The type of object, such as "item", "task" or "status".' }),
    id: podioAiProps.id({ required: true, displayName: 'Object ID', description: 'The id of the object.' }),
    limit: podioAiProps.limit({ required: false, description: 'Maximum number of comments to return. Defaults to 100.' }),
    offset: podioAiProps.offset({ required: false }),
  },
  async run({ auth, propsValue }) {
    const { type, id, limit, offset } = propsValue;
    const body = await podioClient.request<unknown[]>({
      auth,
      method: HttpMethod.GET,
      path: `/comment/${type}/${id}/`,
      query: podioUtils.query({ values: { limit: limit ?? 100, offset } }),
    });
    return { comments: body, count: body.length };
  },
});
