import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const fetchTopStories = createAction({
  name: 'fetch_top_stories', // Must be a unique across the piece, this shouldn't be changed.
  displayName: 'Fetch Top Stories',
  description: 'Fetch top stories from hackernews',
  props: {
    // Properties to ask from the user, in this ask we will take number of
    number_of_stories: Property.Number({
      displayName: 'Number of Stories',
      description: undefined,
      required: true,
    }),
    array: Property.Array({
      displayName: 'Fields',
      description: undefined,
      required: true,
      properties: {
        name: Property.ShortText({
          displayName: 'Name',
          description: 'Name of the person',
          required: true,
        }),
        age: Property.Number({
          displayName: 'Age',
          description: 'Age of the person',
          required: true,
        }),
      }
    }),
    simpleArray : Property.Array({
      displayName: 'Simple Array',
      description: undefined,
      required: true,
    }),
  },
  async run(configValue) {

    return configValue.propsValue;
  },
});
