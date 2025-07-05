import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { filloutFormsAuth } from '../../index';

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
    const apiKey = context.auth as string;
    const response = await makeRequest(apiKey, HttpMethod.GET, `/forms`, undefined);
   
    const forms = response as Array<{ name: string; formId: string }>;
    const searchTitle = context.propsValue['title'].toLowerCase();
    const matches = forms.filter((f) =>
      f.name.toLowerCase().includes(searchTitle)
    );
    return matches;
  },
});
