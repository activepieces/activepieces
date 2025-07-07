import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const wufooFindForm = createAction({
  name: 'find_form',
  displayName: 'Find Form by Name or ID',
  description: 'Locate a specific form by its name or hash.',
  props: {
    formIdentifier: Property.ShortText({
      displayName: 'Form Identifier',
      description: 'The hash or title of the form.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const url = `https://${auth.subdomain}.wufoo.com/api/v3/forms.json`;
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url,
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${auth.apiKey}:footastic`).toString('base64'),
      },
    });
    const forms = response.body.Forms || [];
    const form = forms.find((f: any) => f.Hash === propsValue.formIdentifier || f.Name === propsValue.formIdentifier);
    if (!form) {
      throw new Error('Form not found');
    }
    return form;
  },
}); 