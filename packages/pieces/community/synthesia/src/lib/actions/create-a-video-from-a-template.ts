import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { synthesiaAuth } from '../common/auth';
import { templateIdDropdown } from '../common/props';

export const createAVideoFromATemplate = createAction({
  auth: synthesiaAuth,
  name: 'createAVideoFromATemplate',
  displayName: 'Create a video from a template',
  description: 'Create a video based on a template created in Synthesia',
  props: {
    templateId: templateIdDropdown,
    templateData: Property.Object({
      displayName: 'Template Data',
      description:
        'Key-value pairs for template variables. Keys must match variable names in the template (case-sensitive)',
      required: false,
    }),
    test: Property.Checkbox({
      displayName: 'Test Mode',
      description: 'If enabled, creates a test video with a watermark',
      required: false,
      defaultValue: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Custom title for the video',
      required: false,
    }),
    visibility: Property.StaticDropdown({
      displayName: 'Visibility',
      description: 'The visibility setting for the video',
      required: false,
      options: {
        options: [
          { label: 'Private', value: 'private' },
          { label: 'Public', value: 'public' },
        ],
      },
      defaultValue: 'private',
    }),

    description: Property.LongText({
      displayName: 'Description',
      description: 'Custom description for the video',
      required: false,
    }),
    brandKitId: Property.ShortText({
      displayName: 'Brand Kit ID',
      description:
        'The ID of the brand kit to use (use "workspace_default" for default)',
      required: false,
      defaultValue: 'workspace_default',
    }),
  },
  async run(context) {
    const {
      templateId,
      templateData,
      test,
      visibility,
      title,
      description,
      brandKitId,
    } = context.propsValue;

    const body: any = {
      templateId,
      test: test ? 'true' : 'false',
      visibility: visibility || 'private',
    };

    if (templateData) {
      body.templateData = templateData;
    }

    if (title) {
      body.title = title;
    }

    if (description) {
      body.description = description;
    }

    if (brandKitId) {
      body.brandKitId = brandKitId;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.synthesia.io/v2/videos/fromTemplate',
      headers: {
        Authorization: `Bearer ${context.auth.secret_text}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    return response.body;
  },
});
