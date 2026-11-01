import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { suprsendAuth } from '../auth';
import { splitList, suprsendApiCall } from '../common/client';

export const upsertUser = createAction({
  auth: suprsendAuth,
  name: 'upsert_user',
  classification: 'WRITE',
  displayName: 'Create or Update User',
  description: 'Create a user in SuprSend, or update them if they already exist.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates or updates (upserts) a SuprSend user keyed by distinct ID, setting name, emails, phone numbers, timezone and custom properties. Use this to register or refresh a recipient before sending; it sends no notification. Safe to retry with the same inputs.',
    idempotent: true,
  },
  props: {
    distinctId: Property.ShortText({
      displayName: 'User Distinct ID',
      description: 'The unique ID of the user in your system.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      required: false,
    }),
    emails: Property.ShortText({
      displayName: 'Emails',
      description: 'Comma-separated email addresses.',
      required: false,
    }),
    phones: Property.ShortText({
      displayName: 'Phone Numbers',
      description: 'Comma-separated phone numbers in international format, for example +14155550123.',
      required: false,
    }),
    timezone: Property.ShortText({
      displayName: 'Timezone',
      description: 'IANA timezone name, for example America/New_York.',
      required: false,
    }),
    properties: Property.Object({
      displayName: 'Custom Properties',
      description: 'Extra properties to store on the user, for example `plan`.',
      required: false,
    }),
  },
  async run(context) {
    const { distinctId, name, emails, phones, timezone, properties } = context.propsValue;

    // Custom properties first so the explicit fields always win
    const body: Record<string, unknown> = { ...(properties ?? {}) };
    const emailList = splitList(emails);
    const phoneList = splitList(phones);
    if (name) body['name'] = name;
    if (emailList) body['$email'] = emailList;
    if (phoneList) body['$sms'] = phoneList;
    if (timezone) body['$timezone'] = timezone;

    return suprsendApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/v1/user/${encodeURIComponent(distinctId)}/`,
      body,
    });
  },
});
