import { Property } from '@activepieces/pieces-framework';
import { fetchSequences } from '../../common/service';
import { convertkitAuth } from '../../..';

export const sequenceId = Property.ShortText({
  displayName: 'Sequence ID',
  description: 'The sequence ID',
  required: true,
});

export const sequenceIdDropdown = Property.Dropdown({
  displayName: 'Sequence',
  required: true,
  refreshers: ['auth'],
  auth: convertkitAuth,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your account',
        options: [],
      };
    }

    const sequences = await fetchSequences(auth.secret_text);

    // loop through data and map to options
    const options = sequences.map((field: { id: string; name: string }) => {
      return {
        label: field.name,
        value: field.id,
      };
    });

    return {
      options,
    };
  },
});
