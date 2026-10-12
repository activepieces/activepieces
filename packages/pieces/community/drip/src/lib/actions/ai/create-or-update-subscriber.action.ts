import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { dripAuth } from '../../auth';
import { dripApi } from '../../common/client';
import { dripProps } from '../../common/props';
import { subscriberFieldProps, subscriberInput } from '../../common/subscriber-input';
import { dripOutputSchemas } from '../../output-schemas';

export const createOrUpdateSubscriberAction = createAction({
  auth: dripAuth,
  name: 'create_or_update_subscriber',
  displayName: 'Create or Update Subscriber (by Account ID)',
  description: 'Creates a subscriber or updates the one with this email or ID, without picking the account from a list.',
  classification: 'WRITE',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a Drip subscriber or updates the one with this email (or Drip subscriber ID), setting name, address, phone, time zone, lifetime value and custom fields, adding tags and removing tags; New Email changes their address. Fields you leave out stay unchanged. Matched on email or ID, so repeating the same input is idempotent.',
    idempotent: true,
  },
  props: {
    accountId: dripProps.accountId(),
    subscriber: dripProps.subscriber({ description: 'Email address of the subscriber to create or update, or the Drip subscriber ID of an existing one.' }),
    newEmail: Property.ShortText({ displayName: 'New Email', description: 'Change the subscriber email address to this one.', required: false }),
    ...subscriberFieldProps,
    smsNumber: Property.ShortText({ displayName: 'SMS Number', description: 'Mobile number in E.164 format, e.g. +16125551212 (US numbers only).', required: false }),
    lifetimeValue: Property.Number({ displayName: 'Lifetime Value (cents)', description: 'Total the customer has spent, in cents (e.g. 2500 = $25.00).', required: false }),
    customFields: dripProps.customFields(),
    tags: dripProps.tags({ displayName: 'Add Tags' }),
    removeTags: dripProps.tags({ displayName: 'Remove Tags', description: 'Tags to remove from the subscriber.' }),
  },
  outputSchema: dripOutputSchemas.subscriber,
  async run({ auth, propsValue }) {
    const token = auth.secret_text;
    const identity = dripApi.identify({ value: propsValue.subscriber, label: 'Subscriber Email or ID' });
    const removeTags = dripApi.textList(propsValue.removeTags);
    const record = {
      ...subscriberInput.fields(propsValue),
      ...identity,
      ...dripApi.compact({
        new_email: dripApi.optionalText(propsValue.newEmail),
        sms_number: dripApi.optionalText(propsValue.smsNumber),
        lifetime_value: dripApi.validateInteger({ value: propsValue.lifetimeValue, label: 'Lifetime Value (cents)', min: 0, max: 2_147_483_647 }),
        remove_tags: removeTags && removeTags.length > 0 ? removeTags : undefined,
      }),
    };
    const accountId = await dripApi.resolveAccountId({ token, accountId: propsValue.accountId });
    const body = await dripApi.request<unknown>({
      token,
      method: HttpMethod.POST,
      path: `${dripApi.accountPath(accountId)}/subscribers`,
      operation: 'create or update subscriber',
      body: { subscribers: [record] },
    });
    return dripApi.firstRecord({ body, key: 'subscribers', operation: 'create or update subscriber' });
  },
});
