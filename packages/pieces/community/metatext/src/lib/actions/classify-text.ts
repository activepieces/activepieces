import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { metatextAuth } from '../../index';
import { metatextApiCall } from '../common';

export const classifyText = createAction({
  auth: metatextAuth,
  name: 'classify_text',
  displayName: 'Classify Text',
  description: 'Classify text into categories (sentiment, intent, topic, custom models)',
  props: {
    project_id: Property.ShortText({
      displayName: 'Project ID',
      description: 'The ID of your classification project',
      required: true,
    }),
    text: Property.LongText({
      displayName: 'Text',
      description: 'The text to classify',
      required: true,
    }),
    model: Property.ShortText({
      displayName: 'Model',
      description: 'The model to use for classification',
      required: false,
    }),
    threshold: Property.Number({
      displayName: 'Threshold',
      description: 'Minimum confidence score for predictions',
      required: false,
    }),
    top_labels: Property.Number({
      displayName: 'Top Labels',
      description: 'Maximum number of labels to return',
      required: false,
    }),
    refresh: Property.Checkbox({
      displayName: 'Refresh',
      description: 'Force refresh the classification',
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
    const { project_id, text, model, threshold, top_labels, refresh, version } =
      propsValue;

    const body: Record<string, unknown> = { text };

    if (model) {
      body['model'] = model;
    }

    const options: Record<string, unknown> = {};
    if (threshold !== undefined) options['threshold'] = threshold;
    if (top_labels !== undefined) options['top_labels'] = top_labels;
    if (refresh !== undefined) options['refresh'] = refresh;
    if (version) options['version'] = version;

    if (Object.keys(options).length > 0) {
      body['options'] = options;
    }

    const response = await metatextApiCall({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      endpoint: `/v2/classify/${project_id}`,
      body,
    });

    return response;
  },
});
