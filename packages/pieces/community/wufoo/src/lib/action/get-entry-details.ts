import { createAction, Property } from '@activepieces/pieces-framework';
import axios from 'axios';

const WUFOO_DUMMY_PASSWORD = 'x'; // Wufoo requires any password, value is ignored

export const getEntryDetails = createAction({
  name: 'get_entry_details',
  displayName: 'Get Entry Details',
  description: 'Retrieve details of a specific entry by its ID.',
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
    entryId: Property.ShortText({
      displayName: 'Entry ID',
      required: true,
      description: 'The ID of the entry.'
    })
  },
  async run({ auth, propsValue }) {
    const { subdomain, formHash, entryId } = propsValue;
    const url = `https://${subdomain}.wufoo.com/api/v3/forms/${formHash}/entries/${entryId}.json`;
    const response = await axios.get(url, {
      auth: {
        username: auth as string,
        password: WUFOO_DUMMY_PASSWORD, // Wufoo requires any password, value is ignored
      },
    });
    return response.data;
  },
}); 