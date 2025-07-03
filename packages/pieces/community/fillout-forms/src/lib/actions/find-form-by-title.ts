import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const findFormByTitle = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
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
    const apiKey = (context.auth as Record<string, string>)['apiKey'];
    if (!apiKey) {
      throw new Error('API Key is required for authentication.');
    }
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.fillout.com/v1/api/forms',
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    });
    const forms = response.body as Array<{ name: string; formId: string }>;
    const searchTitle = context.propsValue['title'].toLowerCase();
    const matches = forms.filter(f => f.name.toLowerCase().includes(searchTitle));
    return matches;
  },
});
