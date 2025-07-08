import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';

export const findForm = createAction({
  name: 'find_form',
  displayName: 'Find Form by Name or ID',
  description: 'Locate a specific form by name or hash.',
  props: {
    subdomain: Property.ShortText({
      displayName: 'Wufoo Subdomain',
      required: true,
      description: 'Your Wufoo account subdomain (e.g., myaccount for https://myaccount.wufoo.com)'
    }),
    search: Property.ShortText({
      displayName: 'Form Name or Hash',
      required: true,
      description: 'The name or hash of the form to find.'
    })
  },
  async run({ auth, propsValue }) {
    const { subdomain, search } = propsValue;
    const url = `https://${subdomain}.wufoo.com/api/v3/forms.json`;
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url,
      authentication: {
        type: AuthenticationType.BASIC,
        username: auth as string,
        password: 'x',
      },
    });
    const forms = response.body.Forms || [];
    return forms.find((form: any) => form.Hash === search || form.Name === search) || null;
  },
}); 