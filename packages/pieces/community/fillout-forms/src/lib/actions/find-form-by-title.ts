import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { filloutFormsAuth } from '../common/auth';

export const findFormByTitle = createAction({
  auth: filloutFormsAuth,
  name: 'findFormByTitle',
  displayName: 'Find Form by Title',
  description: 'Search through available forms by title to get the form ID for future use.',
  props: {
    title: Property.ShortText({
      displayName: 'Form Title',
      required: true,
      description: 'The (partial or full) title of the form to search for.'
    })
  },
  async run(context) {
    const apiKey = context.auth;
    
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.fillout.com/v1/api/forms',
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    });
    
    const forms = response.body as Array<{ name: string; formId: string }>;
    const searchTitle = context.propsValue.title.toLowerCase();
    const matches = forms.filter(form => 
      form.name && form.name.toLowerCase().includes(searchTitle)
    );
    
    return matches;
  },
});