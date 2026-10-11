import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { dripAuth } from '../../auth';
import { dripApi } from '../../common/client';
import { dripProps } from '../../common/props';
import { dripOutputSchemas } from '../../output-schemas';

export const subscribeToCampaignAction = createAction({
  auth: dripAuth,
  name: 'subscribe_to_campaign',
  displayName: 'Subscribe to Email Series (by Campaign ID)',
  description: 'Subscribes a contact to an Email Series Campaign by campaign ID, which starts sending that sequence to them.',
  classification: 'WRITE',
  audience: 'ai',
  aiMetadata: {
    description:
      'Subscribes a contact by email to a Drip Email Series Campaign by Campaign ID (from List Email Series), creating the subscriber if needed; this starts sending that email sequence to them. The double opt-in confirmation email is skipped unless Double Opt-In is true. Not idempotent: a repeat call can restart the series for a subscriber who was removed from it.',
    idempotent: false,
  },
  props: {
    accountId: dripProps.accountId(),
    campaignId: Property.ShortText({ displayName: 'Campaign ID', description: 'Email Series Campaign ID (digits, from List Email Series).', required: true }),
    email: dripProps.email(),
    doubleOptin: Property.Checkbox({
      displayName: 'Double Opt-In',
      description: 'Send the double opt-in confirmation email first. Off by default.',
      required: false,
      defaultValue: false,
    }),
    startingEmailIndex: Property.Number({ displayName: 'Starting Email Index', description: 'Zero-based index of the first email to send. Defaults to 0 (the first email).', required: false }),
    reactivateIfRemoved: Property.Checkbox({
      displayName: 'Reactivate if Removed',
      description: 'Re-subscribe the contact if they were removed from this series before. When off, Drip rejects such contacts. Drip defaults to on.',
      required: false,
      defaultValue: true,
    }),
    timeZone: dripProps.timeZone(),
    tags: dripProps.tags(),
    customFields: dripProps.customFields(),
  },
  outputSchema: dripOutputSchemas.campaignSubscribe,
  async run({ auth, propsValue }) {
    const token = auth.secret_text;
    const campaignId = dripApi.parseNumericId({ value: propsValue.campaignId, label: 'Campaign ID' });
    const email = dripApi.requireText({ value: propsValue.email, label: 'Email' });
    const tags = dripApi.textList(propsValue.tags);
    const record = dripApi.compact({
      email,
      double_optin: propsValue.doubleOptin === true,
      starting_email_index: dripApi.validateInteger({ value: propsValue.startingEmailIndex, label: 'Starting Email Index', min: 0, max: 10_000 }),
      reactivate_if_removed: typeof propsValue.reactivateIfRemoved === 'boolean' ? propsValue.reactivateIfRemoved : undefined,
      time_zone: dripApi.optionalText(propsValue.timeZone),
      tags: tags && tags.length > 0 ? tags : undefined,
      custom_fields: dripApi.parseObject({ value: propsValue.customFields, label: 'Custom Fields' }),
    });
    const accountId = await dripApi.resolveAccountId({ token, accountId: propsValue.accountId });
    const body = await dripApi.request<unknown>({
      token,
      method: HttpMethod.POST,
      path: `${dripApi.accountPath(accountId)}/campaigns/${campaignId}/subscribers`,
      operation: 'subscribe to email series',
      body: { subscribers: [record] },
    });
    return { campaignId, subscriber: dripApi.firstRecord({ body, key: 'subscribers', operation: 'subscribe to email series' }) };
  },
});
