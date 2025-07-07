import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const wufooCreateFormEntry = createAction({
  name: 'create_form_entry',
  displayName: 'Create Form Entry',
  description: 'Submit a response to a Wufoo form.',
  props: {
    formIdentifier: Property.ShortText({
      displayName: 'Form Identifier',
      description: 'The hash or title of the form.',
      required: true,
    }),
    fields: Property.Object({
      displayName: 'Fields',
      description: 'Key-value pairs for the form fields. Use API IDs as keys.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { formIdentifier, fields } = propsValue;
    const url = `https://${auth.subdomain}.wufoo.com/api/v3/forms/${formIdentifier}/entries.json`;
    const formData = new URLSearchParams();
    for (const [key, value] of Object.entries(fields)) {
      formData.append(key, value as string);
    }
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url,
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${auth.apiKey}:footastic`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });
    return response.body;
  },
}); 