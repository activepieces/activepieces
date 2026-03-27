import { createAction, Property } from '@activepieces/pieces-framework';
import { pcloudAuth } from '../auth';
import { common } from '../common';

type PcloudSearchResult = {
  result: number;
  metadata: Array<{
    name: string;
    fileid: number;
    size: number;
    contenttype: string;
    created: string;
    modified: string;
    path: string;
    parentfolderid: number;
  }>;
};

export const pcloudFindFile = createAction({
  auth: pcloudAuth,
  name: 'pcloud_find_file',
  displayName: 'Find File',
  description:
    'Find and process all files related to a search query for automated reporting tasks.',
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'The file name or partial name to search for',
      required: true,
    }),
    path: Property.ShortText({
      displayName: 'Path',
      description:
        'Restrict search to this path (e.g. /Documents). Leave empty for all files.',
      required: false,
    }),
  },
  async run(context) {
    const params: Record<string, unknown> = {
      query: context.propsValue.query,
    };
    if (context.propsValue.path) {
      params['path'] = context.propsValue.path;
    }
    const result = await common.pcloudRequest<PcloudSearchResult>(
      context.auth,
      'searchfile',
      params,
    );
    return result;
  },
});
