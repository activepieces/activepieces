import { createAction, Property } from '@activepieces/pieces-framework';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { canvaAuth } from '../auth';
import { canvaApiRequest } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const listDesigns = createAction({
  auth: canvaAuth,
  name: 'list_designs',
  displayName: 'Find Design',
  description:
    'Search for designs in your Canva account by keyword or type. Useful for checking whether a design already exists before creating a new one.',
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Keyword to search for within design titles.',
      required: false,
    }),
    designType: Property.StaticDropdown({
      displayName: 'Design Type',
      description: 'Filter results by design type.',
      required: false,
      options: {
        options: [
          { label: 'Presentation', value: 'presentation' },
          { label: 'Document', value: 'doc' },
          { label: 'Whiteboard', value: 'whiteboard' },
          { label: 'Social Media', value: 'social_media' },
          { label: 'Logo', value: 'logo' },
          { label: 'Poster', value: 'poster' },
          { label: 'Flyer', value: 'flyer' },
          { label: 'Resume', value: 'resume' },
          { label: 'Video', value: 'video' },
        ],
      },
    }),
    continuation: Property.ShortText({
      displayName: 'Continuation Token',
      description: 'Token for fetching the next page of results.',
      required: false,
    }),
  },
  async run(context) {
    const { query, designType, continuation } = context.propsValue;
    const auth = context.auth as OAuth2PropertyValue;

    const queryParams: Record<string, string> = {};
    if (query) queryParams['query'] = query;
    if (designType) queryParams['design_type'] = designType;
    if (continuation) queryParams['continuation'] = continuation;

    const response = await canvaApiRequest({
      auth,
      method: HttpMethod.GET,
      path: '/designs',
      queryParams,
    });

    return response;
  },
});
