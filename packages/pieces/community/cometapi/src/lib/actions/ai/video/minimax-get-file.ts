import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiClient } from '../../../common/client';
import type { CometApiMinimaxResponse } from '../../../common/types';
import { cometApiUtils } from '../../../common/utils';
import { cometapiMinimaxGetFileOutputSchema } from '../../../output-schemas';

export const minimaxGetFileAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_minimax_get_file',
  outputSchema: cometapiMinimaxGetFileOutputSchema,
  displayName: 'Get MiniMax File',
  description: 'Gets the download URL of a finished MiniMax Conch video.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns the metadata and temporary download URL of a finished MiniMax Conch video. Needs the task_id from Create MiniMax Video and the file_id that Get MiniMax Video Task reports once status is Success.',
    idempotent: true,
  },
  props: {
    taskId: cometApiAiProps.minimaxTaskId({ required: true }),
    fileId: Property.ShortText({
      displayName: 'File ID',
      description: 'The file_id reported by Get MiniMax Video Task on success.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await cometApiClient.request<CometApiMinimaxResponse>({
      auth,
      method: HttpMethod.GET,
      path: '/files/retrieve',
      query: { file_id: propsValue.fileId, task_id: propsValue.taskId },
    });
    cometApiUtils.assertMinimaxSucceeded({ response });
    return response;
  },
});
