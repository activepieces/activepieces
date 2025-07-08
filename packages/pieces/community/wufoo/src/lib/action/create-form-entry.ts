import { createAction, Property } from '@activepieces/pieces-framework';
import axios from 'axios';

const WUFOO_DUMMY_PASSWORD = 'x'; // Wufoo requires any password, value is ignored

export const createFormEntry = createAction({
  name: 'create_form_entry',
  displayName: 'Create Form Entry',
  description: 'Submit a response to a Wufoo form.',
  props: {
    subdomain: Property.ShortText({
      displayName: 'Wufoo Subdomain',
      required: true,
      description: 'Your Wufoo account subdomain (e.g., myaccount for https://myaccount.wufoo.com)'
    }),
    formHash: Property.ShortText({
      displayName: 'Form Hash',
      required: true,
      description: 'The hash of the form to submit to.'
    }),
    entry: Property.Object({
      displayName: 'Entry Fields',
      required: true,
      description: 'Key-value pairs for the form fields.'
    })
  },
  async run({ auth, propsValue }) {
    const { subdomain, formHash, entry } = propsValue;
    const url = `https://${subdomain}.wufoo.com/api/v3/forms/${formHash}/entries.json`;
    const response = await axios.post(url, entry, {
      auth: {
        username: auth as string,
        password: WUFOO_DUMMY_PASSWORD, // Wufoo requires any password, value is ignored
      },
    });
    return response.data;
  },
}); 