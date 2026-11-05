import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { discourseAuth } from '../../auth';
import { discourseInput } from '../../common/input';
import { discourseModeration } from '../../common/moderation';
import { discourseSchemas } from '../../common/schemas';

export const silenceUserAction = createAction({
  auth: discourseAuth,
  name: 'silence_user',
  classification: 'WRITE',
  displayName: 'Silence User',
  description: 'Stops a Discourse user from posting until a date.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Silence a Discourse user by numeric user ID: they can still read and log in but cannot post or message until the date (or indefinitely if empty). Moderation action with real impact on a person: only call on an explicit request from a moderator. Needs an admin or moderator key. Optional Message is emailed to the user. Reversible with Unsilence User.',
    idempotent: true,
  },
  props: {
    user_id: Property.ShortText({ displayName: 'User ID', description: 'Numeric user ID.', required: true }),
    silenced_till: Property.DateTime({ displayName: 'Silence Until', description: 'Leave empty for an indefinite silence.', required: false }),
    reason: Property.ShortText({ displayName: 'Reason', required: true }),
    message: Property.LongText({ displayName: 'Message', description: 'Optional message emailed to the user.', required: false }),
  },
  outputSchema: discourseSchemas.moderation,
  async run({ auth, propsValue }) {
    const until = discourseInput.isoDate({ value: propsValue.silenced_till, label: 'Silence Until' });
    const reason = discourseInput.text({ value: propsValue.reason, label: 'Reason' });
    const message = discourseInput.optionalText(propsValue.message);
    return discourseModeration.moderate({
      auth: auth.props,
      userId: propsValue.user_id,
      action: 'silence',
      method: HttpMethod.PUT,
      body: {
        reason,
        ...(until === undefined ? {} : { silenced_till: until }),
        ...(message === undefined ? {} : { message }),
      },
      until,
      reason,
    });
  },
});
