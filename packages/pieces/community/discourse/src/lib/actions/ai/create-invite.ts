import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { discourseAuth } from '../../auth';
import { discourseRequest } from '../../common/client';
import { discourseInput } from '../../common/input';
import { discourseMap } from '../../common/mappers';
import { discourseSchemas } from '../../common/schemas';

export const createInviteAction = createAction({
  auth: discourseAuth,
  name: 'create_invite',
  classification: 'WRITE',
  displayName: 'Create Invite',
  description: 'Creates a Discourse invite link, optionally emailed to someone.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Create a Discourse invite. With an Email and Skip Email off, Discourse sends a real invitation email to that address, so only do this for people who asked to be invited. Without an email it returns a shareable link usable Max Redemptions times. Can add the invitee to groups and open a topic. Each call creates a new invite.',
    idempotent: false,
  },
  props: {
    email: Property.ShortText({ displayName: 'Email', description: 'Optional. Leave empty for a shareable link.', required: false }),
    skip_email: Property.Checkbox({ displayName: 'Skip Email', description: 'On to create the invite without sending an email.', required: false, defaultValue: false }),
    custom_message: Property.LongText({ displayName: 'Custom Message', required: false }),
    max_redemptions_allowed: Property.Number({ displayName: 'Max Redemptions', description: 'For link invites. Default 1.', required: false }),
    group_ids: Property.Array({ displayName: 'Group IDs', description: 'Numeric group IDs to add the invitee to.', required: false }),
    topic_id: Property.ShortText({ displayName: 'Topic ID', description: 'Optional topic to show after signup.', required: false }),
    expires_at: Property.DateTime({ displayName: 'Expires At', required: false }),
  },
  outputSchema: discourseSchemas.invite,
  async run({ auth, propsValue }) {
    const email = discourseInput.optionalText(propsValue.email);
    if (email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Email must be a valid email address.');
    }
    const groupIds = discourseInput
      .stringList({ value: propsValue.group_ids, label: 'Group IDs', required: false })
      .map((value) => discourseInput.id({ value, label: 'Group ID' }));
    const topicId = discourseInput.optionalId({ value: propsValue.topic_id, label: 'Topic ID' });
    const message = discourseInput.optionalText(propsValue.custom_message);
    const expiresAt = discourseInput.isoDate({ value: propsValue.expires_at, label: 'Expires At' });
    const maxRedemptions =
      email === undefined
        ? discourseInput.boundedNumber({ value: propsValue.max_redemptions_allowed, label: 'Max Redemptions', min: 1, max: 1000000, fallback: 1 })
        : undefined;
    const body = await discourseRequest({
      auth: auth.props,
      method: HttpMethod.POST,
      path: '/invites.json',
      body: {
        ...(email === undefined ? {} : { email, skip_email: propsValue.skip_email === true }),
        ...(maxRedemptions === undefined ? {} : { max_redemptions_allowed: maxRedemptions }),
        ...(message === undefined ? {} : { custom_message: message }),
        ...(groupIds.length === 0 ? {} : { group_ids: groupIds.map(Number) }),
        ...(topicId === undefined ? {} : { topic_id: Number(topicId) }),
        ...(expiresAt === undefined ? {} : { expires_at: expiresAt }),
      },
    });
    return discourseMap.invite({ raw: body });
  },
});
