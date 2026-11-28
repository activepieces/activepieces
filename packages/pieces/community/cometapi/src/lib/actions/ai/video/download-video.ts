import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiAuth } from '../../../auth';
import { cometApiAiProps } from '../../../common/ai-props';
import { cometApiClient } from '../../../common/client';
import { cometapiDownloadVideoOutputSchema } from '../../../output-schemas';

export const downloadVideoAction = createAction({
  auth: cometApiAuth,
  name: 'cometapi_download_video',
  outputSchema: cometapiDownloadVideoOutputSchema,
  displayName: 'Download Video',
  description: 'Saves the finished MP4 of a completed video task as a file.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Downloads the MP4 of a task started with Create Video and stores it as a file, returning its reference. Only works once Get Video reports status completed; the vendor rejects unfinished tasks.',
    idempotent: true,
  },
  props: {
    taskId: cometApiAiProps.videoTaskId({ required: true }),
  },
  async run({ auth, propsValue, files }) {
    const video = await cometApiClient.request<ArrayBuffer>({
      auth,
      method: HttpMethod.GET,
      path: `/videos/${encodeURIComponent(propsValue.taskId)}/content`,
      responseType: 'arraybuffer',
    });
    const file = await files.write({
      fileName: 'video.mp4',
      data: Buffer.from(video),
    });
    return { file };
  },
});
