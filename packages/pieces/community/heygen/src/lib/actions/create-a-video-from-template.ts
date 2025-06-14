import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { heygenAuth } from '../../index';
import { makeRequest } from '../common';

export const generateVideoFromTemplateAction = createAction({
  name: 'generate_video_from_template',
  displayName: 'Generate Video from Template',
  description: 'Generate a video using a specific HeyGen template.',
  auth: heygenAuth,
  props: {
    templateId: Property.ShortText({
      displayName: 'Template ID',
      required: true,
      description: 'The ID of the template to use for generating the video.',
    }),
    title: Property.ShortText({
      displayName: 'Title',
      required: true,
      description: 'Title of the generated video.',
    }),
    caption: Property.Checkbox({
      displayName: 'Enable Captions',
      required: false,
      defaultValue: false,
    }),
    includeGif: Property.Checkbox({
      displayName: 'Include GIF Preview',
      required: false,
      defaultValue: false,
    }),
    enableSharing: Property.Checkbox({
      displayName: 'Enable Public Sharing',
      required: false,
      defaultValue: false,
    }),
    folderId: Property.ShortText({
      displayName: 'Folder ID',
      required: false,
      description: 'ID of the folder where the video will be stored.',
    }),
    brandVoiceId: Property.ShortText({
      displayName: 'Brand Voice ID',
      required: false,
      description: 'ID of the Brand Voice to apply to the video.',
    }),
    callbackUrl: Property.ShortText({
      displayName: 'Callback URL',
      required: false,
      description: 'Webhook URL to notify when video rendering is complete.',
    }),
    dimensionWidth: Property.Number({
      displayName: 'Video Width',
      required: false,
      defaultValue: 1280,
    }),
    dimensionHeight: Property.Number({
      displayName: 'Video Height',
      required: false,
      defaultValue: 720,
    }),
    variables: Property.Json({
      displayName: 'Template Variables (JSON)',
      required: false,
      description: 'Dynamic variables to be passed into the template. Must match template variable keys.',
    }),
  },
  async run({ propsValue, auth }) {
    const {
      templateId,
      title,
      caption,
      includeGif,
      enableSharing,
      folderId,
      brandVoiceId,
      callbackUrl,
      dimensionWidth,
      dimensionHeight,
      variables,
    } = propsValue;

    const apiKey = auth as string;
    const body: Record<string, unknown> = {
      title,
      caption: caption === true,
      include_gif: includeGif === true,
      enable_sharing: enableSharing === true,
    };

    if (folderId) body['folder_id'] = folderId;
    if (brandVoiceId) body['brand_voice_id'] = brandVoiceId;
    if (callbackUrl) body['callback_url'] = callbackUrl;
    if (dimensionWidth && dimensionHeight) {
      body['dimension'] = {
        width: dimensionWidth,
        height: dimensionHeight,
      };
    }
    if (variables) {
      body['variables'] = variables;
    }

    const response = await makeRequest(
      apiKey,
      HttpMethod.POST,
      `/v2/template/${templateId}/generate`,
      body
    );

    return response;
  },
});
