import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { dropboxAuth } from '../auth';
import { dropboxCommon } from '../common';
import { searchOutputSchema } from '../output-schemas';

export const dropboxSearch = createAction({
  auth: dropboxAuth,
  name: 'search_dropbox',
  classification: 'SEARCH',
  description: 'Search for files and folders',
  audience: 'both',
  aiMetadata: { description: 'Searches a Dropbox account for files and folders whose name or content matches a query string (minimum 3 characters), optionally scoped to a path and filtered by file status, extensions, categories, or account. Use to locate items and obtain their paths/IDs before acting on them. Read-only; repeating the same search is safe and returns the same matches.', idempotent: true },
  displayName: 'Search',
  outputSchema: searchOutputSchema,
  propertyGroups: [
    {
      key: 'search',
      display: 'section',
      label: 'Search',
      icon: 'filter',
      props: ['query', 'filename_only'],
    },
    {
      key: 'where',
      display: 'section',
      label: 'Where to Look',
      icon: 'location',
      props: ['path', 'file_status', 'file_extensions', 'file_categories'],
    },
    {
      key: 'results',
      display: 'section',
      label: 'Results',
      icon: 'sliders',
      props: ['order_by', 'max_results'],
    },
  ],
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description: 'Words to find in file and folder names or contents.',
      placeholder: 'invoice',
      required: true,
    }),
    path: Property.ShortText({
      displayName: 'Path',
      description: 'Folder to search in. Empty: the whole Dropbox.',
      placeholder: '/Reports',
      required: false,
    }),
    max_results: Property.Number({
      displayName: 'Max Results',
      description: 'Maximum matches to return, up to 1,000. Empty: 100.',
      required: false,
    }),
    order_by: Property.StaticDropdown({
      displayName: 'Order By',
      description: 'How to sort the matches. Empty: by relevance.',
      options: {
        options: [
          { label: 'Relevance', value: 'relevance' },
          { label: 'Last Modified', value: 'modified_time' },
        ],
      },
      defaultValue: 'relevance',
      required: false,
    }),
    file_status: Property.StaticDropdown({
      displayName: 'File Status',
      description: 'Current or deleted files. Empty: current files.',
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
      description: 'Match names only, not file contents.',
      defaultValue: false,
      required: false,
    }),
    file_extensions: Property.ShortText({
      displayName: 'File Extensions',
      description: 'Comma-separated, without the dot.',
      placeholder: 'pdf, docx',
      required: false,
    }),
    file_categories: Property.ShortText({
      displayName: 'File Categories',
      description:
        'Comma-separated: image, document, pdf, spreadsheet, presentation, audio, video, folder, paper, others.',
      placeholder: 'image, pdf',
      required: false,
    }),
    account_id: Property.ShortText({
      displayName: 'Account ID',
      description: "Team accounts: only this member's files. Starts with dbid:.",
      required: false,
      advanced: true,
    }),
  },
  async run(context) {
    const options = {
      path: dropboxCommon.toApiPath(context.propsValue.path || ''),
      max_results: context.propsValue.max_results || 100,
      order_by: toSearchOrderBy(context.propsValue.order_by),
      file_status: context.propsValue.file_status,
      filename_only: context.propsValue.filename_only,
      file_extensions: nonEmptyOrUndefined(
        splitCommaList(context.propsValue.file_extensions)
          .map((extension) => extension.replace(/^\./, ''))
          .filter((extension) => extension.length > 0)
      ),
      file_categories: nonEmptyOrUndefined(
        splitCommaList(context.propsValue.file_categories).map((category) =>
          category.toLowerCase()
        )
      ),
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

function toSearchOrderBy(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  return value === 'modified_time' ? 'last_modified_time' : value;
}

function splitCommaList(value: string | undefined): string[] {
  if (!value) {
    return [];
  }
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function nonEmptyOrUndefined(items: string[]): string[] | undefined {
  return items.length > 0 ? items : undefined;
}
