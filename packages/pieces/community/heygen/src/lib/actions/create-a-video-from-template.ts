import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { heygenAuth } from '../common/auth';
import { heygenApiCall } from '../common/client';
import { folderDropdown, brandVoiceDropdown, templateDropdown } from '../common/props';

export const createVideoFromTemplateAction = createAction({
  auth: heygenAuth,
  name: 'create-video-from-template',
  displayName: 'Create Video from Template',
  description: 'Create a video using a selected template.',
  props: {
    templateId: templateDropdown,
    title: Property.ShortText({
      displayName: 'Video Title',
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
    folderId: folderDropdown,
    brandVoiceId: brandVoiceDropdown,
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
      description: 'Dynamic variables to pass into the template.',
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

    const body: Record<string, unknown> = {
      template_id: templateId,
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

    const response = await heygenApiCall({
      apiKey: auth as string,
      method: HttpMethod.POST,
      resourceUri: `/template/${templateId}/generate`,
      body,
      apiVersion: 'v2',
    });

    return response;
  },
});
