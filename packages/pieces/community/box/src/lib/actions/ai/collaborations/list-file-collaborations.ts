import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxUtils } from '../../../common/utils';

export const listFileCollaborationsAction = createAction({
  auth: boxAuth,
  name: 'box_list_file_collaborations',
  displayName: 'List File Collaborations',
  description: 'Lists who has been invited to a Box file.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists one page of the pending and active collaborations on a file, with their IDs, users or groups and roles. Page with Marker (next_marker). Get the file ID from List Folder Items or Search.',
    idempotent: true,
  },
  props: {
    fileId: boxAiProps.fileId({ required: true }),
    limit: boxAiProps.limit({ required: false }),
    marker: boxAiProps.marker({ required: false }),
    fields: boxAiProps.fields({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/files/${encodeURIComponent(propsValue.fileId)}/collaborations`,
      query: {
        limit: boxUtils.limitParam({ limit: propsValue.limit, max: 1000, fallback: 100 }),
        marker: propsValue.marker,
        fields: propsValue.fields,
      },
    });
  },
});
