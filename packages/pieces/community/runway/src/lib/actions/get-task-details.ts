import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { runwayAuth } from '../..';

export const getTaskDetails = createAction({
  auth: runwayAuth,
  name: 'get-task-details',
  displayName: 'Get Task Details',
  description: 'Retrieve details of an existing Runway task by its ID.',
  props: {
    task_id: Property.ShortText({
      displayName: 'Task ID',
      required: true,
      description: 'The ID of the task to retrieve details for.',
    }),
  },
  async run(context) {
    const { task_id } = context.propsValue;

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `https://api.runwayml.com/v1/tasks/${task_id}`,
      headers: {
        Authorization: `Bearer ${context.auth.api_key}`,
        'Content-Type': 'application/json',
      },
    };

    const response = await httpClient.sendRequest(request);

    const taskData = response.body;

    if (taskData.status === 'completed' && taskData.output) {
      const result: any = {
        task_id: taskData.id,
        status: taskData.status,
        created_at: taskData.created_at,
        completed_at: taskData.completed_at,
        progress: taskData.progress,
        output: taskData.output,
      };

      if (taskData.output.video_url) {
        try {
          const videoResponse = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: taskData.output.video_url,
            responseType: 'arraybuffer',
          });

          result.video_file = await context.files.write({
            data: Buffer.from(videoResponse.body),
            fileName: `runway-video-${task_id}.mp4`,
          });
        } catch (error) {
          result.video_download_error = 'Failed to download video file';
        }
      }

      if (taskData.output.image_url) {
        try {
          const imageResponse = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: taskData.output.image_url,
            responseType: 'arraybuffer',
          });

          result.image_file = await context.files.write({
            data: Buffer.from(imageResponse.body),
            fileName: `runway-image-${task_id}.png`,
          });
        } catch (error) {
          result.image_download_error = 'Failed to download image file';
        }
      }

      return result;
    }

    return {
      task_id: taskData.id,
      status: taskData.status,
      created_at: taskData.created_at,
      progress: taskData.progress,
      output: taskData.output,
      error: taskData.error,
    };
  },
});
