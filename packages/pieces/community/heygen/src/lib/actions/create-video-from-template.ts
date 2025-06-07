import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const createAVideoFromTemplate = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'createAVideoFromTemplate',
  displayName: 'Create a Video From Template',
  description: 'Generate a video using a HeyGen template with customizable variables and settings',
  props: {
    template_id: Property.ShortText({
      displayName: 'Template ID',
      description: 'The ID of the template to use',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Title of the video',
      required: false,
    }),
    caption: Property.Checkbox({
      displayName: 'Enable Captions',
      description: 'Whether to enable video captions',
      required: false,
      defaultValue: false,
    }),
    variables: Property.Json({
      displayName: 'Template Variables',
      description: `Dynamic variables used within the template. Each variable must include a 'type' discriminator. Example:
      {
        "heading": {
          "type": "text",
          "value": "Welcome to Our Platform"
        },
        "background_color": {
          "type": "color",
          "value": "#f6f6fc"
        },
        "logo": {
          "type": "image",
          "value": "https://example.com/logo.png"
        },
        "features": {
          "type": "list",
          "value": ["Feature 1", "Feature 2"]
        }
      }`,
      required: true,
      defaultValue: {
        heading: {
          type: "text",
          value: "Hello World"
        },
        background: {
          type: "color",
          value: "#f6f6fc"
        }
      }
    }),
    width: Property.Number({
      displayName: 'Video Width',
      description: 'Width of the video in pixels',
      required: false,
      defaultValue: 1280,
    }),
    height: Property.Number({
      displayName: 'Video Height',
      description: 'Height of the video in pixels',
      required: false,
      defaultValue: 720,
    }),
    include_gif: Property.Checkbox({
      displayName: 'Include GIF Preview',
      description: 'Include a GIF preview URL in the webhook response',
      required: false,
      defaultValue: false,
    }),
    enable_sharing: Property.Checkbox({
      displayName: 'Enable Sharing',
      description: 'Make the video publicly shareable immediately after creation',
      required: false,
      defaultValue: false,
    }),
    folder_id: Property.ShortText({
      displayName: 'Folder ID',
      description: 'ID of the folder where the video will be stored',
      required: false,
    }),
    brand_voice_id: Property.ShortText({
      displayName: 'Brand Voice ID',
      description: 'ID of the Brand Voice to apply to the video',
      required: false,
    }),
    callback_url: Property.ShortText({
      displayName: 'Callback URL',
      description: 'The URL to notify when video rendering is complete',
      required: false,
    }),
  },
  async run(context) {
    const {
      template_id,
      title,
      caption,
      variables,
      width,
      height,
      include_gif,
      enable_sharing,
      folder_id,
      brand_voice_id,
      callback_url,
    } = context.propsValue;

    try {
      // Validate variables is a valid object
      if (typeof variables !== 'object' || variables === null) {
        throw new Error('Template variables must be a valid JSON object');
      }

      // Validate each variable has a type discriminator
      for (const [key, variableValue] of Object.entries(variables)) {
        if (variableValue === null || typeof variableValue !== 'object') {
          throw new Error(`Variable '${key}' must be an object with 'type' and 'value' properties`);
        }
        if (!('type' in variableValue) || !('value' in variableValue)) {
          throw new Error(`Variable '${key}' must include 'type' and 'value' properties`);
        }
      }

      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `https://api.heygen.com/v2/template/${template_id}/generate`,
        headers: {
          'x-api-key': context.auth as string,
          'Content-Type': 'application/json',
        },
        body: {
          title,
          caption,
          variables,
          dimension: { width, height },
          include_gif,
          enable_sharing,
          folder_id,
          brand_voice_id,
          callback_url,
        },
      });

      return {
        success: true,
        video_id: response.body.video_id,
      };
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error('Authentication failed. Please check your API key.');
      }
      if (error.response?.status === 404) {
        throw new Error(`Template with ID ${template_id} not found.`);
      }
      if (error.response?.status === 400) {
        throw new Error(`Invalid request: ${error.response.body?.message || error.message}`);
      }
      throw new Error(`Failed to generate video: ${error.message}`);
    }
  },
});
