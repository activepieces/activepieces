import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { discourseAuth } from '../../auth';
import { discourseInput } from '../../common/input';
import { discourseModeration } from '../../common/moderation';
import { discourseSchemas } from '../../common/schemas';

export const suspendUserAction = createAction({
  auth: discourseAuth,
  name: 'suspend_user',
  classification: 'WRITE',
  displayName: 'Suspend User',
  description: 'Suspends a Discourse user until a date.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Suspend a Discourse user by numeric user ID until a date, which logs them out and blocks login; the reason is shown to them and logged. Moderation action with real impact on a person: only call on an explicit request from a moderator. Needs an admin or moderator key. Optional Message is emailed to the user. Reversible with Unsuspend User; repeating sets the same end date.',
    idempotent: true,
  },
  props: {
    user_id: Property.ShortText({ displayName: 'User ID', description: 'Numeric user ID.', required: true }),
    suspend_until: Property.DateTime({ displayName: 'Suspend Until', description: 'End date of the suspension.', required: true }),
    reason: Property.ShortText({ displayName: 'Reason', required: true }),
    message: Property.LongText({ displayName: 'Message', description: 'Optional message emailed to the user.', required: false }),
  },
  outputSchema: discourseSchemas.moderation,
  async run({ auth, propsValue }) {
    const until = discourseInput.isoDate({ value: propsValue.suspend_until, label: 'Suspend Until' });
    if (until === undefined) {
      throw new Error('Suspend Until is required.');
    }
    const reason = discourseInput.text({ value: propsValue.reason, label: 'Reason' });
    const message = discourseInput.optionalText(propsValue.message);
    return discourseModeration.moderate({
      auth: auth.props,
      userId: propsValue.user_id,
      action: 'suspend',
      method: HttpMethod.PUT,
      body: { suspend_until: until, reason, ...(message === undefined ? {} : { message }) },
      until,
      reason,
    });
  },
});
