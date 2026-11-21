import { createAction, Property } from '@activepieces/pieces-framework';
import { vapiAuth } from '../auth';
import { vapiUtils } from '../common/vapi-api';
import { vapiResources } from '../common/props';
import { vapiFlatten } from '../common/flatten';
import { vapiOutputSchemas } from '../common/output-schemas';

export const findPhoneNumber = createAction({
  auth: vapiAuth,
  name: 'find_phone_number',
  classification: 'SEARCH',
  displayName: 'Find Phone Number',
  description: 'Find phone numbers by number or name.',
  audience: 'ai',
  outputSchema: vapiOutputSchemas.findPhoneNumber,
  aiMetadata: {
    description:
      'Finds the phone numbers in the Vapi organization and returns each one\'s ID, number, name, provider and the assistant or squad that answers it. Optional Number or Name Contains matches part of the number (digits only are compared) or of the name, case-insensitive; leave it empty to list all. Matching is done by this tool over up to 1000 numbers. If Truncated is true, more records exist than were scanned and a match may be missing: use a more specific value or the ID from the Vapi dashboard. Use the returned ID as the phone number ID in Place Call or Update Phone Number. Read-only.',
    idempotent: true,
  },
  props: {
    numberOrNameContains: Property.ShortText({ displayName: 'Number or Name Contains', required: false }),
    limit: Property.Number({ displayName: 'Limit', description: 'Maximum results (1-100). Defaults to 20.', required: false }),
  },
  async run(context) {
    const needle = context.propsValue.numberOrNameContains?.trim() ?? '';
    const needleDigits = needle.replace(/\D/g, '');
    const { items: phoneNumbers, truncated } = await vapiResources.find({
      apiKey: context.auth.secret_text,
      path: '/phone-number',
      operation: 'list phone numbers',
      flatten: vapiFlatten.phoneNumberSummary,
      matches: (item) =>
        needle === '' ||
        vapiUtils.containsIgnoreCase({ haystack: item.name, needle }) ||
        vapiUtils.containsIgnoreCase({ haystack: item.number, needle }) ||
        (needleDigits !== '' && item.number !== null && item.number.replace(/\D/g, '').includes(needleDigits)),
      limit: vapiUtils.clampLimit({ value: context.propsValue.limit, defaultValue: 20, max: 100 }),
    });
    return { phoneNumbers, truncated };
  },
});
