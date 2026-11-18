import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaProps, asanaUtils } from '../../common/client';
import { asanaStoryOutputSchema } from '../../output-schemas';

export const asanaAddTaskCommentAction = createAction({
  auth: asanaAuth,
  name: 'add_task_comment',
  classification: 'WRITE',
  displayName: 'Add Task Comment',
  description: 'Post a comment on an Asana task.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Posts a comment on a task as the connected user, in plain text or Asana rich text (one of the two), optionally pinned. Followers of the task are notified. Each call posts a new comment, so retries duplicate.',
    idempotent: false,
  },
  outputSchema: asanaStoryOutputSchema,
  props: {
    task: Property.ShortText({
      displayName: 'Task GID',
      description: 'Gid of the task to comment on. Obtain it from List Project Tasks or Search Workspace Objects.',
      required: true,
    }),
    text: Property.LongText({
      displayName: 'Text',
      description: 'Plain-text comment. Provide this or HTML Text, not both.',
      required: false,
    }),
    html_text: Property.LongText({
      displayName: 'HTML Text',
      description: 'Rich-text comment in Asana rich text, wrapped in <body>...</body>, for example <body>Done, see <a href="https://example.com">the doc</a></body>. Provide this or Text, not both.',
      required: false,
    }),
    is_pinned: asanaProps.optionalBoolean({
      displayName: 'Pin Comment',
      description: 'Yes pins the comment to the top of the task. Leave empty to post it unpinned.',
    }),
  },
  async run(context) {
    const { task, text, html_text, is_pinned } = context.propsValue;
    asanaUtils.assertNotBoth({ first: text, second: html_text, firstLabel: 'Text', secondLabel: 'HTML Text' });
    if (!asanaUtils.hasValue(text) && !asanaUtils.hasValue(html_text)) {
      throw new Error('Provide the comment in Text or HTML Text.');
    }
    return asanaClient.asanaData<AsanaRecord>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/tasks/${asanaUtils.pathSegment(task)}/stories`,
      operation: 'Add Task Comment',
      query: { opt_fields: ASANA_FIELDS.story },
      data: {
        ...(asanaUtils.hasValue(text) ? { text } : {}),
        ...(asanaUtils.hasValue(html_text) ? { html_text } : {}),
        ...(is_pinned !== undefined && is_pinned !== null ? { is_pinned } : {}),
      },
    });
  },
});
