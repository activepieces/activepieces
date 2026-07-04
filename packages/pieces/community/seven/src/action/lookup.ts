import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sevenAuth } from '../lib/auth';
import { callSevenApi } from '../common';

export const lookup = createAction({
  auth: sevenAuth,
  name: 'lookup',
  displayName: 'Lookup Phone Numbers',
  description: 'Get information about CNAM, HLR, MNP, RCS capabilities and Number formats.',
  audience: 'both',
  aiMetadata: {
    description: 'Looks up information about one or more phone numbers via the seven gateway. The lookup type selects what is returned — CNAM (caller name), HLR (network/status), MNP (number portability), RCS capability, or number format validation. Use to validate or enrich phone numbers before messaging. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    type: Property.StaticDropdown<string, true>({
      options: {
        options: [
          {label: 'CNAM', value: 'cnam'},
          {label: 'HLR', value: 'hlr'},
          {label: 'Format', value: 'format'},
          {label: 'MNP', value: 'mnp'},
          {label: 'RCS capabilities', value: 'rcs'}
        ]
      },
      displayName: 'Type',
      required: true
    }),
    numbers: Property.Array({
      description: 'The phone numbers to look up.',
      displayName: 'Numbers',
      required: true
    }),
  },
  async run(context) {
    const { numbers, type } = context.propsValue;

    const response= await callSevenApi({
      queryParams: {
        number: numbers.join(','),
      },
      method: HttpMethod.GET
    }, `lookup/${type}`, context.auth.secret_text);

    return response.body;

  }
});
