import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import axios from 'axios';

const WUFOO_DUMMY_PASSWORD = 'x'; // Wufoo requires any password, value is ignored

export const newForm = createTrigger({
  name: 'new_form',
  displayName: 'New Form',
  description: 'Fires when a new form is created in the Wufoo account.',
  props: {
    subdomain: Property.ShortText({
      displayName: 'Wufoo Subdomain',
      required: true,
      description: 'Your Wufoo account subdomain (e.g., myaccount for https://myaccount.wufoo.com)'
    })
  },
  sampleData: {
    Hash: 'a1b2c3',
    Name: 'Sample Form',
    DateCreated: '2024-01-01 12:00:00',
    Description: 'A sample Wufoo form',
  },
  type: TriggerStrategy.POLLING,
  async onEnable() {},
  async onDisable() {},
  async run(context) {
    const { auth, propsValue } = context;
    const { subdomain } = propsValue;
    const url = `https://${subdomain}.wufoo.com/api/v3/forms.json`;
    const response = await axios.get(url, {
      auth: {
        username: auth as string,
        password: WUFOO_DUMMY_PASSWORD, // Wufoo requires any password, value is ignored
      },
    });
    const forms = response.data.Forms || [];
    return forms;
  },
}); 