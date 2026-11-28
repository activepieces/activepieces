import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxUtils } from '../../../common/utils';
import { boxSearchOutputSchema } from '../../../output-schemas';

const TYPES = ['file', 'folder', 'web_link'];

export const searchAction = createAction({
  auth: boxAuth,
  name: 'box_search',
  outputSchema: boxSearchOutputSchema,
  displayName: 'Search',
  description: 'Searches Box for files, folders and web links.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Full-text search across names, descriptions, tags and file content the user can see; returns one page of matches with IDs. Newly uploaded files take a few minutes to become searchable. Page with Offset. Use Query Metadata to filter by metadata values.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description: 'Text to search for. Wrap in quotes for an exact phrase; supports AND, OR and NOT.',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Type',
      description: 'Limit to "file", "folder" or "web_link".',
      required: false,
      options: { options: TYPES.map((value) => ({ label: value, value })) },
    }),
    ancestorFolderIds: Property.ShortText({
      displayName: 'Ancestor Folder IDs',
      description: 'Comma-separated folder IDs to search within (and their subfolders).',
      required: false,
    }),
    fileExtensions: Property.ShortText({
      displayName: 'File Extensions',
      description: 'Comma-separated extensions without dots, e.g. "pdf,docx".',
      required: false,
    }),
    contentTypes: Property.ShortText({
      displayName: 'Content Types',
      description: 'Comma-separated parts to search: name, description, file_content, comments, tag.',
      required: false,
    }),
    additionalQuery: Property.Json({
      displayName: 'Additional Filters',
      description: 'Other Box search query parameters as strings, e.g. {"created_at_range": "2024-01-01T00:00:00Z,", "owner_user_ids": "123"}.',
      required: false,
    }),
    limit: boxAiProps.limit({ required: false, description: 'Max results to return (1-200). Defaults to 30.' }),
    offset: boxAiProps.offset({ required: false }),
    fields: boxAiProps.fields({ required: false }),
  },
  async run({ auth, propsValue }) {
    if (propsValue.type !== undefined && !TYPES.includes(propsValue.type)) {
      throw new Error(`Type must be one of: ${TYPES.join(', ')}.`);
    }
    const extra = Object.fromEntries(
      Object.entries(propsValue.additionalQuery ?? {}).map(([key, value]) => [key, String(value)]),
    );
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: '/search',
      query: {
        ...extra,
        query: propsValue.query,
        type: propsValue.type,
        ancestor_folder_ids: propsValue.ancestorFolderIds,
        file_extensions: propsValue.fileExtensions,
        content_types: propsValue.contentTypes,
        limit: boxUtils.limitParam({ limit: propsValue.limit, max: 200, fallback: 30 }),
        offset: boxUtils.optionalString({ value: propsValue.offset }),
        fields: propsValue.fields,
      },
    });
  },
});
