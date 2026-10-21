import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { discourseAuth } from '../../auth';
import { discourseRequest } from '../../common/client';
import { discourseInput } from '../../common/input';
import { discourseMap } from '../../common/mappers';
import { discourseSchemas } from '../../common/schemas';

export const inviteToTopicAction = createAction({
  auth: discourseAuth,
  name: 'invite_to_topic',
  classification: 'WRITE',
  displayName: 'Invite to Topic',
  description: 'Invites a user or an email address to a Discourse topic.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Invite an existing Discourse user (by username) or a person (by email) to a topic or private message by numeric topic ID. Many forums only allow invites to private messages; inviting to a regular topic then fails with "You can only invite to personal messages". A username gets a notification and is added to private messages; an email address receives a real invitation email, so only use addresses of people who expect it. Each call can send another notification or email.',
    idempotent: false,
  },
  props: {
    topic_id: Property.ShortText({ displayName: 'Topic ID', description: 'Numeric topic ID.', required: true }),
    user: Property.ShortText({ displayName: 'Username or Email', required: true }),
    custom_message: Property.LongText({ displayName: 'Custom Message', description: 'Used for email invites.', required: false }),
  },
  outputSchema: discourseSchemas.topicInvite,
  async run({ auth, propsValue }) {
    const id = discourseInput.id({ value: propsValue.topic_id, label: 'Topic ID' });
    const target = discourseInput.text({ value: propsValue.user, label: 'Username or Email' });
    const isEmail = target.includes('@');
    const message = discourseInput.optionalText(propsValue.custom_message);
    const body = discourseMap.rec(
      await discourseRequest({
        auth: auth.props,
        method: HttpMethod.POST,
        path: `/t/${id}/invite.json`,
        body: {
          ...(isEmail ? { email: target } : { user: target }),
          ...(message === undefined ? {} : { custom_message: message }),
        },
      }),
    );
    const user = discourseMap.rec(body['user']);
    return {
      topic_id: Number(id),
      success: true,
      invited: target,
      user_id: discourseMap.num(user['id']),
      username: discourseMap.str(user['username']),
    };
  },
});
