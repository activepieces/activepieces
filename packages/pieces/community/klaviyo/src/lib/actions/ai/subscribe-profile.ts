import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../../common/auth';
import { ConsentChannel, klaviyoApi, subscribeJobBody } from '../../common/client';
import { normalizePhone } from '../../common/props';
import { klaviyoInputs } from '../../common/ai-props';
import { klaviyoOutputSchemas } from '../../common/output-schemas';

export const subscribeProfileAi = createAction({
  auth: klaviyoAuth,
  name: 'subscribe_profile_ai',
  classification: 'WRITE',
  displayName: 'Subscribe Profile to Marketing',
  description: 'Give one person email and/or SMS marketing consent.',
  audience: 'ai',
  aiMetadata: {
    description: 'Grants email and/or SMS marketing consent to one person by email and/or phone number, optionally adding them to a list; the profile is created if none matches. Only use when the person has actually opted in: it lifts their unsubscribe, spam-report and manual suppressions, and a double opt-in list sends them a confirmation email. To only change list membership use Add Profile to List. Klaviyo applies it asynchronously. Not idempotent: a repeat on a double opt-in list may send another confirmation email.',
    idempotent: false,
  },
  outputSchema: klaviyoOutputSchemas.aiConsent,
  props: {
    email: Property.ShortText({ displayName: 'Email', description: 'Email address. Required for the email channel.', required: false }),
    phone_number: Property.ShortText({ displayName: 'Phone Number', description: 'E.164 phone number, e.g. +15005550006. Required for the sms channel.', required: false }),
    channel: Property.StaticDropdown<string>({
      displayName: 'Channel',
      description: 'Which marketing consent to grant.',
      required: true,
      options: {
        options: [
          { label: 'Email', value: 'email' },
          { label: 'SMS', value: 'sms' },
          { label: 'Email and SMS', value: 'both' },
        ],
      },
    }),
    list_id: klaviyoInputs.idProp({
      displayName: 'List ID',
      description: 'Optional list to subscribe them to. Get it from List Lists or Find List by Name. Without a list the account default opt-in setting applies.',
      required: false,
    }),
    historical_import: klaviyoInputs.yesNoProp({
      displayName: 'Historical Import',
      description: '"yes" records consent collected earlier: no confirmation email, no "added to list" flows, and Consented At is required. Omit for no.',
    }),
    consented_at: Property.ShortText({
      displayName: 'Consented At',
      description: 'ISO 8601 date-time in the past when the person consented. Only used with Historical Import "yes".',
      required: false,
    }),
    custom_source: Property.ShortText({
      displayName: 'Custom Source',
      description: 'Label for where consent was collected, e.g. "Checkout page".',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const channel = klaviyoInputs.oneOf({ value: propsValue.channel, label: 'Channel', allowed: ['email', 'sms', 'both'] });
    if (channel === undefined) {
      throw new Error('Channel is required.');
    }
    const channels: ConsentChannel[] = channel === 'both' ? ['email', 'sms'] : channel === 'sms' ? ['sms'] : ['email'];
    const email = klaviyoInputs.optionalText(propsValue.email);
    const phoneText = klaviyoInputs.optionalText(propsValue.phone_number);
    const phone = phoneText === undefined ? undefined : normalizePhone(phoneText);
    if (channels.includes('email') && email === undefined) {
      throw new Error('Email is required for the email channel.');
    }
    if (channels.includes('sms') && phone === undefined) {
      throw new Error('Phone Number is required for the sms channel.');
    }
    const historicalImport = klaviyoInputs.yesNo({ value: propsValue.historical_import, label: 'Historical Import' }) === true;
    const consentedAt = klaviyoInputs.isoDateTime({ value: propsValue.consented_at, label: 'Consented At' });
    if (historicalImport && consentedAt === undefined) {
      throw new Error('Consented At is required when Historical Import is "yes".');
    }
    if (!historicalImport && consentedAt !== undefined) {
      throw new Error('Consented At can only be sent with Historical Import "yes".');
    }
    const listId = klaviyoInputs.optionalText(propsValue.list_id);
    const sentEmail = channels.includes('email') ? email : undefined;
    const sentPhone = channels.includes('sms') ? phone : undefined;
    await klaviyoApi.send({
      auth,
      method: HttpMethod.POST,
      path: '/profile-subscription-bulk-create-jobs',
      body: subscribeJobBody({
        profiles: [{ email: sentEmail, phone_number: sentPhone, channels }],
        listId,
        customSource: klaviyoInputs.optionalText(propsValue.custom_source),
        historicalImport,
        consentedAt,
      }),
    });
    return { accepted: true, email: sentEmail ?? null, phone_number: sentPhone ?? null, channels, list_id: listId ?? null };
  },
});
