import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxListFileTasksOutputSchema } from '../../../output-schemas';

export const listFileTasksAction = createAction({
  auth: boxAuth,
  name: 'box_list_file_tasks',
  outputSchema: boxListFileTasksOutputSchema,
  displayName: 'List File Tasks',
  description: 'Lists the tasks on a Box file.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists all tasks on a file with their IDs, actions, due dates and assignments. Get the file ID from List Folder Items or Search.',
    idempotent: true,
  },
  props: {
    fileId: boxAiProps.fileId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/files/${encodeURIComponent(propsValue.fileId)}/tasks`,
    });
  },
});
