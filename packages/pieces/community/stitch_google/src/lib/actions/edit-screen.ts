import { createAction, Property } from '@activepieces/pieces-framework';
import { stitchGoogleAuth } from '../auth';
import { stitchClient, extractApiKey } from '../common';

export const editScreenAction = createAction({
  auth: stitchGoogleAuth,
  name: 'edit_screen',
  displayName: 'Edit Screen',
  description: 'Edit an existing screen with a new text prompt. The AI will apply your changes on top of the existing design.',
  props: {
    project_id: Property.ShortText({
      displayName: 'Project ID',
      description: 'The ID of the project that contains the screen.',
      required: true,
    }),
    screen_id: Property.ShortText({
      displayName: 'Screen ID',
      description: 'The ID of the screen to edit. Get this from the "List Screens" or "Generate Screen" actions.',
      required: true,
    }),
    prompt: Property.LongText({
      displayName: 'Edit Instructions',
      description: 'Describe the changes to make to the screen (e.g. "Make the background dark, move the logo to the top left, and add a sidebar navigation").',
      required: true,
    }),
    device_type: Property.StaticDropdown({
      displayName: 'Device Type',
      description: 'Specify the device form factor for the edited output.',
      required: false,
      defaultValue: 'MOBILE',
      options: {
        options: [
          { label: 'Mobile', value: 'MOBILE' },
          { label: 'Desktop', value: 'DESKTOP' },
          { label: 'Tablet', value: 'TABLET' },
          { label: 'Agnostic', value: 'AGNOSTIC' },
        ],
      },
    }),
    model: Property.StaticDropdown({
      displayName: 'AI Model',
      description: 'Choose the Gemini model to use for the edit.',
      required: false,
      defaultValue: 'GEMINI_3_FLASH',
      options: {
        options: [
          { label: 'Gemini 3 Flash (faster)', value: 'GEMINI_3_FLASH' },
          { label: 'Gemini 3 Pro (higher quality)', value: 'GEMINI_3_PRO' },
        ],
      },
    }),
  },
  async run(context) {
    const apiKey = extractApiKey(context.auth);
    const { project_id, screen_id, prompt, device_type, model } =
      context.propsValue;

    const args: Record<string, unknown> = {
      projectId: project_id,
      screenId: screen_id,
      prompt,
    };

    if (device_type) args['deviceType'] = device_type;
    if (model) args['modelId'] = model;

    const result = await stitchClient.callStitchTool<StitchScreenResult>(
      apiKey,
      'edit_screen',
      args
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
