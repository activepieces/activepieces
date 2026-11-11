import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../../common/auth';
import { ConsentChannel, klaviyoApi, unsubscribeJobBody } from '../../common/client';
import { normalizePhone } from '../../common/props';
import { klaviyoInputs } from '../../common/ai-props';
import { klaviyoOutputSchemas } from '../../common/output-schemas';

export const unsubscribeProfileAi = createAction({
  auth: klaviyoAuth,
  name: 'unsubscribe_profile_ai',
  classification: 'DESTRUCTIVE',
  displayName: 'Unsubscribe Profile from Marketing',
  description: 'Remove one person\'s email and/or SMS marketing consent.',
  audience: 'ai',
  aiMetadata: {
    description: 'Revokes email and/or SMS marketing consent for one person by email and/or phone number. With a list ID, a person who is not on that list is unsubscribed from all marketing; without one they are unsubscribed globally. An email or phone that matches no profile creates a new, unsubscribed profile. Klaviyo applies it asynchronously. Idempotent: repeating it leaves the person unsubscribed.',
    idempotent: true,
  },
  outputSchema: klaviyoOutputSchemas.aiConsent,
  props: {
    email: Property.ShortText({ displayName: 'Email', description: 'Email address. Required for the email channel.', required: false }),
    phone_number: Property.ShortText({ displayName: 'Phone Number', description: 'E.164 phone number. Required for SMS channels.', required: false }),
    channel: Property.StaticDropdown<string>({
      displayName: 'Channel',
      description: 'Which consent to revoke. "all" covers email, SMS marketing and SMS transactional, as far as the identifiers given allow.',
      required: true,
      options: {
        options: [
          { label: 'Email', value: 'email' },
          { label: 'SMS marketing', value: 'sms' },
          { label: 'SMS transactional', value: 'sms_transactional' },
          { label: 'All', value: 'all' },
        ],
      },
    }),
    list_id: klaviyoInputs.idProp({
      displayName: 'List ID',
      description: 'Optional list to unsubscribe them from. Get it from List Lists or Find List by Name.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const channel = klaviyoInputs.oneOf({ value: propsValue.channel, label: 'Channel', allowed: ['email', 'sms', 'sms_transactional', 'all'] });
    if (channel === undefined) {
      throw new Error('Channel is required.');
    }
    const email = klaviyoInputs.optionalText(propsValue.email);
    const phoneText = klaviyoInputs.optionalText(propsValue.phone_number);
    const phone = phoneText === undefined ? undefined : normalizePhone(phoneText);
    const channels = channelsFor({ channel, hasEmail: email !== undefined, hasPhone: phone !== undefined });
    if (channels.length === 0) {
      throw new Error('Provide an Email or Phone Number.');
    }
    if (channels.includes('email') && email === undefined) {
      throw new Error('Email is required for the email channel.');
    }
    if (channels.some((item) => item !== 'email') && phone === undefined) {
      throw new Error('Phone Number is required for SMS channels.');
    }
    const listId = klaviyoInputs.optionalText(propsValue.list_id);
    const sentEmail = channels.includes('email') ? email : undefined;
    const sentPhone = channels.some((item) => item !== 'email') ? phone : undefined;
    await klaviyoApi.send({
      auth,
      method: HttpMethod.POST,
      path: '/profile-subscription-bulk-delete-jobs',
      body: unsubscribeJobBody({
        profiles: [{ email: sentEmail, phone_number: sentPhone, channels }],
        listId,
      }),
    });
    return { accepted: true, email: sentEmail ?? null, phone_number: sentPhone ?? null, channels, list_id: listId ?? null };
  },
});

function channelsFor({ channel, hasEmail, hasPhone }: { channel: string; hasEmail: boolean; hasPhone: boolean }): ConsentChannel[] {
  if (channel === 'email') {
    return ['email'];
  }
  if (channel === 'sms') {
    return ['sms'];
  }
  if (channel === 'sms_transactional') {
    return ['sms_transactional'];
  }
  const channels: ConsentChannel[] = [];
  if (hasEmail) {
    channels.push('email');
  }
  if (hasPhone) {
    channels.push('sms', 'sms_transactional');
  }
  return channels;
}
