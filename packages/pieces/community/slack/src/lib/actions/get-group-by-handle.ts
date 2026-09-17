import { createAction, Property } from '@activepieces/pieces-framework';
import { slackAuth } from '../auth';
import { WebClient } from '@slack/web-api';
import { getBotToken, SlackAuthValue } from '../common/auth-helpers';
import { getGroupByHandleActionOutputSchema } from '../output-schemas';

export const getGroupByHandleAction = createAction({
  auth: slackAuth,
  name: 'get_group_by_handle',
  classification: 'READ',
  displayName: 'Get User Group by Handle',
  description: 'Finds a user group by handle and returns its ID.',
  audience: 'both',
  aiMetadata: { description: 'Look up a Slack user group (subteam) by its handle and return the group, including its ID for building an <!subteam^ID> mention; read-only and repeatable. Use this for groups, not individuals (use Find User by Handle/ID for people). Matches case-insensitively on the handle and errors if no group has that handle.', idempotent: true },
  outputSchema: getGroupByHandleActionOutputSchema,
  props: {
    handle: Property.ShortText({
      displayName: 'Group Handle',
      description: 'Handle without the leading @.',
      placeholder: 'engineering',
      required: true,
    }),
  },
  async run(context) {
    const token = getBotToken(context.auth as SlackAuthValue);
    const client = new WebClient(token);
    const searchHandle = context.propsValue.handle.replace('@', '').toLowerCase();

    const response = await client.usergroups.list();

    const group = response.usergroups?.find(
      (g) => g.handle && g.handle.toLowerCase() === searchHandle
    );

    if (!group) {
      throw new Error(`User group with handle '@${searchHandle}' not found.`);
    }

    return group; 
  },
});
