import { createAction, Property } from '@activepieces/pieces-framework';
import axios from 'axios';

const WUFOO_DUMMY_PASSWORD = 'x'; // Wufoo requires any password, value is ignored

export const findSubmissionByFieldValue = createAction({
  name: 'find_submission_by_field_value',
  displayName: 'Find Submission by Field Value',
  description: 'Search for a specific submission based on field values.',
  props: {
    subdomain: Property.ShortText({
      displayName: 'Wufoo Subdomain',
      required: true,
      description: 'Your Wufoo account subdomain (e.g., myaccount for https://myaccount.wufoo.com)'
    }),
    formHash: Property.ShortText({
      displayName: 'Form Hash',
      required: true,
      description: 'The hash of the form.'
    }),
    field: Property.ShortText({
      displayName: 'Field Name or ID',
      required: true,
      description: 'The field name or ID to search by.'
    }),
    value: Property.ShortText({
      displayName: 'Field Value',
      required: true,
      description: 'The value to search for.'
    })
  },
  async run({ auth, propsValue }) {
    const { subdomain, formHash, field, value } = propsValue;
    const url = `https://${subdomain}.wufoo.com/api/v3/forms/${formHash}/entries.json`;
    const response = await axios.get(url, {
      auth: {
        username: auth as string,
        password: WUFOO_DUMMY_PASSWORD, // Wufoo requires any password, value is ignored
      },
    });
    const entries = response.data.Entries || [];
    return entries.find((entry: any) => entry[field] === value) || null;
  },
}); 