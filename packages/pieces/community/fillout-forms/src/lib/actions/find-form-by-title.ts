import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { filloutFormsAuth } from '../auth';

export const findFormByTitle = createAction({
  auth: filloutFormsAuth,
  name: 'findFormByTitle',
  displayName: 'Find Form by Title',
  description: 'Finds an existing forms by title.',
  audience: 'both',
  aiMetadata: { description: 'Searches the account\'s Fillout forms for those whose title contains the given text (case-insensitive partial match) and returns the matches. Use to resolve a form name to its form ID before calling response-fetching actions. Read-only and idempotent.', idempotent: true },
  props: {
    title: Property.ShortText({
      displayName: 'Form Title',
      required: true,
      description: 'The (partial or full) title of the form to search for.'
    })
  },
  async run(context) {
    const apiKey = context.auth.secret_text;
    const response = await makeRequest(apiKey, HttpMethod.GET, `/forms`, undefined);
   
    const forms = response as Array<{ name: string; formId: string }>;
    const searchTitle = context.propsValue['title'].toLowerCase();
    const matches = forms.filter((f) =>
      f.name.toLowerCase().includes(searchTitle)
    );
    return {
      found:matches.length>0,
      result:matches
    };
  },
});
