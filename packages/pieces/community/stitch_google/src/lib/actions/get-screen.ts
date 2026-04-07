import { createAction, Property } from '@activepieces/pieces-framework';
import { stitchGoogleAuth } from '../auth';
import { stitchClient, extractApiKey } from '../common';

export const getScreenAction = createAction({
  auth: stitchGoogleAuth,
  name: 'get_screen',
  displayName: 'Get Screen',
  description: 'Retrieve a specific screen from a project, including its HTML and screenshot download URLs.',
  props: {
    project_id: Property.ShortText({
      displayName: 'Project ID',
      description: 'The ID of the project that contains the screen.',
      required: true,
    }),
    screen_id: Property.ShortText({
      displayName: 'Screen ID',
      description: 'The ID of the screen to retrieve. You can get this from the "List Screens" or "Generate Screen" actions.',
      required: true,
    }),
  },
  async run(context) {
    const apiKey = extractApiKey(context.auth);
    const { project_id, screen_id } = context.propsValue;

    const result = await stitchClient.callStitchTool<StitchScreenResult>(
      apiKey,
      'get_screen',
      { projectId: project_id, screenId: screen_id }
    );

    return {
      screen_id: result.screenId ?? result.id,
      project_id: result.projectId ?? project_id,
      display_name: result.displayName,
      device_type: result.deviceType,
      html_url: result.htmlUrl,
      image_url: result.imageUrl,
      created_time: result.createTime,
      updated_time: result.updateTime,
    };
  },
});

type StitchScreenResult = {
  id: string;
  screenId: string;
  projectId: string;
  displayName: string;
  deviceType: string;
  htmlUrl: string;
  imageUrl: string;
  createTime: string;
  updateTime: string;
};
