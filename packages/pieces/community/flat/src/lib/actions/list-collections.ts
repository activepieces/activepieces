import { createAction, Property } from '@activepieces/pieces-framework';
import { flatAuth } from '../auth';
import { flatApiClient } from '../common';

export const listCollectionsAction = createAction({
  auth: flatAuth,
  name: 'list_collections',
  displayName: 'List the collections',
  description: 'Use this method to list the user\'s collections contained in `parent` (by default in the `root` collection). If no sort option is provided, the collections are sorted by `creationDate` `desc`.  Note that this method will not include the `parent` collection in the listing. For example, if you need the details of the `root` collection, you can use `GET /v2/collections/root`. ',
  props: {
    parent: Property.ShortText({
      displayName: 'Parent',
      description: 'List the collection contained in this `parent` collection.  This option doesn\'t provide a complete multi-level collection support. When sharing a collection with someone, this one will have as `parent` `sharedWithMe`. ',
      required: false,
      defaultValue: "root",
    }),
    sort: Property.StaticDropdown({
      displayName: 'Sort',
      description: 'Sort',
      required: false,
      options: {
        options: [{ label: 'creationDate', value: "creationDate" }, { label: 'title', value: "title" }],
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
      auth, endpoint: '/collections',
      queryParams: {
        parent: propsValue.parent,
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
