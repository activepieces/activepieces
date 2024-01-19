import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { dropboxAuth } from '../..';

export const dropboxSearch = createAction({
  auth: dropboxAuth,
  name: 'search_dropbox',
  description: 'Search for files and folders',
  displayName: 'Search',
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description: 'The search string. Must be at least 3 characters.',
      required: true,
    }),
    path: Property.ShortText({
      displayName: 'Path',
      description:
        'The path to search in. If not specified, the search is performed from the root.',
      required: false,
    }),
    max_results: Property.Number({
      displayName: 'Max Results',
      description:
        'The maximum number of search results to return (up to 1000). Default is 100 if not specified.',
      required: false,
    }),
    order_by: Property.StaticDropdown({
      displayName: 'Order By',
      description: 'Specified property of the order of search results.',
      options: {
        options: [
          { label: 'Relevance', value: 'relevance' },
          { label: 'Modified Time', value: 'modified_time' },
        ],
      },
      defaultValue: 'relevance',
      required: false,
    }),
    file_status: Property.StaticDropdown({
      displayName: 'File Status',
      description: 'Restricts search to the given file status.',
      options: {
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Deleted', value: 'deleted' },
        ],
      },
      defaultValue: 'active',
      required: false,
    }),
    filename_only: Property.Checkbox({
      displayName: 'Filename Only',
      description: 'Restricts search to only match on filenames.',
      defaultValue: false,
      required: false,
    }),
    file_extensions: Property.ShortText({
      displayName: 'File Extensions',
      description:
        'Restricts search to only the extensions specified (comma-separated).',
      required: false,
    }),
    file_categories: Property.ShortText({
      displayName: 'File Categories',
      description:
        'Restricts search to only the file categories specified (comma-separated).',
      required: false,
    }),
    account_id: Property.ShortText({
      displayName: 'Account ID',
      description: 'Restricts results to the given account id.',
      required: false,
    }),
  },
  async run(context) {
    const options = {
      path: context.propsValue.path || '',
      max_results: context.propsValue.max_results || 100,
      file_status: context.propsValue.file_status,
      filename_only: context.propsValue.filename_only,
      file_extensions: context.propsValue.file_extensions
        ? context.propsValue.file_extensions.split(',')
        : undefined,
      file_categories: context.propsValue.file_categories
        ? context.propsValue.file_categories.split(',')
        : undefined,
      account_id: context.propsValue.account_id,
    };

    const requestBody = {
      query: context.propsValue.query,
      options: options,
    };

    const result = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api.dropboxapi.com/2/files/search_v2`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: requestBody,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    return result.body;
  },
});
