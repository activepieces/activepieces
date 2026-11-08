import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetIconSuggestionsOutputSchema } from '../../../output-schemas';

export const getIconSuggestionsAction = createAction({
  auth: podioAuth,
  name: 'podio_get_icon_suggestions',
  outputSchema: podioGetIconSuggestionsOutputSchema,
  displayName: 'Get Icon Suggestions',
  description: 'Searches the app icons that match a term.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns the ids of Podio app icons that match a search term, to pick an icon for Create App or Update App.',
    idempotent: true,
  },
  props: {
    query: podioAiProps.text({ required: true, displayName: 'Search Term', description: 'A word describing the icon, such as "calendar" or "money".' }),
  },
  async run({ auth, propsValue }) {
    const icons = await podioClient.request<unknown[]>({
      auth,
      method: HttpMethod.GET,
      path: '/app/icon/search',
      query: podioUtils.query({ values: { query: propsValue.query } }),
    });
    return { icons, count: icons.length };
  },
});
