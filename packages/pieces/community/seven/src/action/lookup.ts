import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sevenAuth } from '../index';
import { callSevenApi } from '../common';

export const lookup = createAction({
  auth: sevenAuth,
  name: 'lookup',
  description: 'Get information about CNAM, HLR, MNP, RCS capabilities and Number formats.',
  displayName: 'Lookup',
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
      description: 'The phone numbers for looking up',
      displayName: 'Numbers',
      required: true
    }),
  },
  async run(context) {
    const { numbers, type } = context.propsValue;

    return await callSevenApi({
      queryParams: {
        number: numbers.join(','),
      },
      method: HttpMethod.GET
    }, `lookup/${type}`, context.auth as string);

  }
});
