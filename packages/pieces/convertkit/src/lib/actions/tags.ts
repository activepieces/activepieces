import {
    createAction,
    Property,
    DynamicPropsValue,
  } from '@activepieces/pieces-framework';
  import { convertkitAuth } from '../..';
  import { CONVERTKIT_API_URL } from '../common';
  
  const API_ENDPOINT = 'custom_tags/';

  export const listTags = createAction({
    auth: convertkitAuth,
    name: 'tags_list_tags',
    displayName: 'Tags: List Tags',
    description: 'Returns a list of all tags',
    props: {},
    async run(context) {
      const url = `${CONVERTKIT_API_URL}${API_ENDPOINT}?api_secret=${context.auth}`;
  
      // Fetch URL using fetch api
      const response = await fetch(url);
  
      // Get response body
      const data = await response.json();
  
      // Return response body
      return data;
    },
  });