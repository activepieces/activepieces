import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { waflyAuth, waflyApiCall, normalizePhone } from '../common';

export const checkPhones = createAction({
  auth: waflyAuth,
  name: 'check_phones',
  displayName: 'Check Numbers on WhatsApp',
  description: 'Check which of a list of phone numbers exist on WhatsApp.',
  audience: 'both',
  aiMetadata: {
    description:
      'Checks a batch of phone numbers and reports which ones have a WhatsApp account. Read-only and idempotent. Useful for cleaning a list before a send, so messages are not attempted against numbers that cannot receive them.',
    idempotent: true,
  },
  props: {
    phones: Property.Array({
      displayName: 'Phone Numbers',
      description: 'International format, e.g. 5511999999999.',
      required: true,
    }),
  },
  async run(context) {
    const phones = (context.propsValue.phones as string[])
      .map((phone) => normalizePhone(String(phone)))
      .filter((phone) => phone.length > 0);

    if (phones.length === 0) {
      throw new Error('Provide at least one phone number.');
    }

    return await waflyApiCall({
      auth: context.auth,
      method: HttpMethod.POST,
      resourceUri: '/phone-exists-batch',
      body: { phones },
    });
  },
});
