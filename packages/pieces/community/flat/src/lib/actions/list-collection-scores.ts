import { createAction, Property } from '@activepieces/pieces-framework';
import { flatAuth } from '../auth';
import { flatApiClient } from '../common';

export const listCollectionScoresAction = createAction({
  auth: flatAuth,
  name: 'list_collection_scores',
  displayName: 'List the scores contained in a collection',
  description: 'Use this method to list the scores contained in a collection. If no sort option is provided, the scores are sorted by `modificationDate` `desc`. ',
  props: {
    sort: Property.StaticDropdown({
      displayName: 'Sort',
      description: 'Sort',
      required: false,
      options: {
        options: [{ label: 'creationDate', value: "creationDate" }, { label: 'modificationDate', value: "modificationDate" }, { label: 'title', value: "title" }],
      },
    }),
    direction: Property.StaticDropdown({
      displayName: 'Direction',
      description: 'Sort direction',
      required: false,
      options: {
        options: [{ label: 'asc', value: "asc" }, { label: 'desc', value: "desc" }],
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'This is the maximum number of objects that may be returned',
      required: false,
      defaultValue: 25,
    }),
    next: Property.ShortText({
      displayName: 'Next',
      description: 'An opaque string cursor to fetch the next page of data. The paginated API URLs are returned in the `Link` header when requesting the API. These URLs will contain a `next` and `previous` cursor based on the available data. ',
      required: false,
    }),
    previous: Property.ShortText({
      displayName: 'Previous',
      description: 'An opaque string cursor to fetch the previous page of data. The paginated API URLs are returned in the `Link` header when requesting the API. These URLs will contain a `next` and `previous` cursor based on the available data. ',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await flatApiClient.get({
      auth, endpoint: '/collections/{collection}/scores',
      queryParams: {
        sort: propsValue.sort,
        direction: propsValue.direction,
        limit: propsValue.limit,
        next: propsValue.next,
        previous: propsValue.previous,
      },
    });
    return response.body;
  },
});
