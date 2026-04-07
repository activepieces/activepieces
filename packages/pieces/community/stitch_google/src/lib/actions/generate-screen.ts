import { createAction, Property } from '@activepieces/pieces-framework';
import { stitchGoogleAuth } from '../auth';
import { stitchClient, extractApiKey } from '../common';

export const generateScreenAction = createAction({
  auth: stitchGoogleAuth,
  name: 'generate_screen',
  displayName: 'Generate Screen from Text',
  description: 'Generate a new UI screen in a Stitch project from a text prompt using Google AI.',
  props: {
    project_id: Property.ShortText({
      displayName: 'Project ID',
      description: 'The ID of the project to generate the screen in. Use the "List Projects" or "Create Project" action to get a project ID.',
      required: true,
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'Describe the screen you want to generate (e.g. "A modern login page with email and password fields, a sign-in button, and a Google sign-in option").',
      required: true,
    }),
    device_type: Property.StaticDropdown({
      displayName: 'Device Type',
      description: 'Choose the device form factor for the generated screen.',
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
      description: 'Choose the Gemini model to use for generation.',
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
    const { project_id, prompt, device_type, model } = context.propsValue;

    const args: Record<string, unknown> = {
      projectId: project_id,
      prompt,
    };

    if (device_type) args['deviceType'] = device_type;
    if (model) args['modelId'] = model;

    const result = await stitchClient.callStitchTool<StitchScreenResult>(
      apiKey,
      'generate_screen_from_text',
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
};
