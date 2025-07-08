import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';

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
  sampleData: {
    EntryId: '1',
    DateCreated: '2024-01-01 12:00:00',
    Field1: 'Sample Value',
    Field2: 'Another Value',
  },
  type: TriggerStrategy.POLLING,
  async onEnable() {},
  async onDisable() {},
  async run(context) {
    const { auth, propsValue } = context;
    const { subdomain, formHash } = propsValue;
    const url = `https://${subdomain}.wufoo.com/api/v3/forms/${formHash}/entries.json`;
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url,
      authentication: {
        type: AuthenticationType.BASIC,
        username: auth as string,
        password: 'x',
      },
    });
    const entries = response.body.Entries || [];
    return entries;
  },
}); 