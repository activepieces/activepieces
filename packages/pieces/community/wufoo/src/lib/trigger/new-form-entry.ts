import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import axios from 'axios';

export const newFormEntry = createTrigger({
  name: 'new_form_entry',
  displayName: 'New Form Entry',
  description: 'Fires when someone fills out a form.',
  props: {
    subdomain: Property.ShortText({
      displayName: 'Wufoo Subdomain',
      required: true,
      description: 'Your Wufoo account subdomain (e.g., myaccount for https://myaccount.wufoo.com)'
    }),
    formHash: Property.ShortText({
      displayName: 'Form Hash',
      required: true,
      description: 'The hash of the form to watch.'
    })
  },
  type: TriggerStrategy.POLLING,
  async onEnable() {},
  async onDisable() {},
  async run({ auth, propsValue, lastFetchEpochMS }) {
    const { subdomain, formHash } = propsValue;
    const url = `https://${subdomain}.wufoo.com/api/v3/forms/${formHash}/entries.json`;
    const response = await axios.get(url, {
      auth: {
        username: auth as string,
        password: 'footastic',
      },
    });
    const entries = response.data.Entries || [];
    // Only return entries created after lastFetchEpochMS
    return entries.filter((entry: any) => {
      const created = new Date(entry.DateCreated).getTime();
      return !lastFetchEpochMS || created > lastFetchEpochMS;
    });
  },
}); 