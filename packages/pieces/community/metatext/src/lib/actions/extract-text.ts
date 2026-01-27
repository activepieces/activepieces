import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { metatextAuth } from '../../index';
import { metatextApiCall } from '../common';

export const extractText = createAction({
  auth: metatextAuth,
  name: 'extract_text',
  displayName: 'Extract Text',
  description: 'Extract information from text (entities, keywords, custom models)',
  props: {
    project_id: Property.ShortText({
      displayName: 'Project ID',
      description: 'The ID of your extraction project',
      required: true,
    }),
    text: Property.LongText({
      displayName: 'Text',
      description: 'The text to extract information from',
      required: true,
    }),
    model: Property.ShortText({
      displayName: 'Model',
      description: 'The model to use for extraction',
      required: false,
    }),
    refresh: Property.Checkbox({
      displayName: 'Refresh',
      description: 'Force refresh the extraction',
      required: false,
      defaultValue: false,
    }),
    version: Property.ShortText({
      displayName: 'Version',
      description: 'Model version to use',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { project_id, text, model, refresh, version } = propsValue;

    const body: Record<string, unknown> = { text };

    if (model) {
      body['model'] = model;
    }

    if (refresh !== undefined || version) {
      body['options'] = {
        ...(refresh !== undefined && { refresh }),
        ...(version && { version }),
      };
    }

    const response = await metatextApiCall({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      endpoint: `/v2/extract/${project_id}`,
      body,
    });

    return response;
  },
});
