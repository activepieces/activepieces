import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackAuth } from '../../';
import { issueDropdown, youtrackApiCall } from '../common';

export const applyCommandAction = createAction({
  auth: youtrackAuth,
  name: 'apply_command',
  displayName: 'Apply Command',
  description: 'Applies a YouTrack command to an issue (e.g. change state, assign, set sprint).',
  props: {
    issue: issueDropdown,
    command: Property.ShortText({
      displayName: 'Command',
      description: 'YouTrack command. Examples: State Fixed | assignee jane.doe | Priority Critical | for me Critical',
      required: true,
    }),
    comment: Property.LongText({ displayName: 'Comment', description: 'Optional comment.', required: false }),
    silent: Property.Checkbox({ displayName: 'Apply silently?', description: 'No notifications if enabled.', required: false, defaultValue: false }),
  },
  async run(context) {
    const { baseUrl, apiToken } = context.auth.props;
    const body: Record<string, unknown> = { query: context.propsValue.command, issues: [{ id: context.propsValue.issue }] };
    if (context.propsValue.comment) body['comment'] = context.propsValue.comment;
    if (context.propsValue.silent) body['silent'] = true;
    await youtrackApiCall({
      baseUrl,
      token: apiToken,
      method: HttpMethod.POST,
      path: '/commands',
      body,
    });
    return { success: true, command: context.propsValue.command };
  },
});
