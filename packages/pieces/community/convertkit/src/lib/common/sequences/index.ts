import { Property } from '@activepieces/pieces-framework';
import { fetchSequences } from '../../common/service';
import { convertkitAuth } from '../../auth';

export const sequenceId = Property.ShortText({
  displayName: 'Sequence ID',
  description: "Find it in the sequence's URL in Kit.",
  placeholder: '1234567',
  required: true,
});

export const sequenceIdDropdown = Property.Dropdown({
  displayName: 'Sequence',
  description: 'A sequence in your Kit account.',
  required: true,
  refreshers: ['auth'],
  auth: convertkitAuth,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your account first',
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
