import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxUtils } from '../../../common/utils';

const SORTS = ['id', 'name', 'date'];
const DIRECTIONS = ['ASC', 'DESC'];

export const listFolderItemsAction = createAction({
  auth: boxAuth,
  name: 'box_list_folder_items',
  displayName: 'List Folder Items',
  description: 'Lists the files, folders and web links in a Box folder.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists one page of the files, folders and web links directly inside a folder, with their IDs and types. Use folder "0" for the root. Page with Marker (next_marker) for large folders; use Search to find items anywhere.',
    idempotent: true,
  },
  props: {
    folderId: boxAiProps.folderId({ required: true }),
    limit: boxAiProps.limit({ required: false }),
    marker: boxAiProps.marker({ required: false }),
    sort: Property.StaticDropdown({
      displayName: 'Sort',
      description: 'Sort by "id", "name" or "date". Folders always come first.',
      required: false,
      options: { options: SORTS.map((value) => ({ label: value, value })) },
    }),
    direction: Property.StaticDropdown({
      displayName: 'Direction',
      description: '"ASC" or "DESC".',
      required: false,
      options: { options: DIRECTIONS.map((value) => ({ label: value, value })) },
    }),
    fields: boxAiProps.fields({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/folders/${encodeURIComponent(propsValue.folderId)}/items`,
      query: {
        usemarker: 'true',
        marker: propsValue.marker,
        limit: boxUtils.limitParam({ limit: propsValue.limit, max: 1000, fallback: 100 }),
        sort: propsValue.sort,
        direction: propsValue.direction,
        fields: propsValue.fields,
      },
    });
  },
});
