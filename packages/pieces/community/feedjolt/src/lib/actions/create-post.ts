import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { feedjoltAuth } from '../auth';
import { feedjoltCommon } from '../common';

export const createPost = createAction({
  auth: feedjoltAuth,
  name: 'create_post',
  classification: 'WRITE',
  displayName: 'Create Post',
  description: 'Create a feedback post on a board.',
  audience: 'both',
  aiMetadata: {
    description:
      'Create a feedback post on a board with a title and optional markdown body. Each call creates a new post, so retries duplicate.',
    idempotent: false,
  },
  props: {
    workspaceSlug: feedjoltCommon.workspaceDropdown,
    boardSlug: feedjoltCommon.boardSlugDropdown,
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Post title shown on the board. Example: "Add dark mode to the dashboard".',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Body',
      description: 'Optional post body in Markdown.',
      required: false,
    }),
    isInternal: Property.Checkbox({
      displayName: 'Internal only',
      description: 'Hide this post from the public board.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const requestBody: Record<string, unknown> = {
      title: context.propsValue.title,
      is_internal: context.propsValue.isInternal ?? false,
    };
    if (context.propsValue.body) {
      requestBody['body'] = context.propsValue.body;
    }

    const response = await feedjoltCommon.apiCall({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/workspaces/${encodeURIComponent(context.propsValue.workspaceSlug)}/boards/${encodeURIComponent(context.propsValue.boardSlug)}/posts`,
      body: requestBody,
    });
    if (!feedjoltCommon.isRecord(response.body)) {
      throw new Error('Feedjolt returned an unexpected create-post payload.');
    }
    return feedjoltCommon.flattenPost(response.body);
  },
});
