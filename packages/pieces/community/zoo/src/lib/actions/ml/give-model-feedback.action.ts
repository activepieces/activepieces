import { createAction, Property } from '@activepieces/pieces-framework';
import { zooAuth } from '../../../index'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const giveModelFeedbackAction = createAction({
  name: 'give_model_feedback',
  displayName: 'Give Model Feedback',
  description: 'Provide feedback on a generated 3D model',
  auth: zooAuth,
  // category: 'Machine Learning (ML)',
  props: {
    modelId: Property.ShortText({
      displayName: 'Model ID',
      required: true,
      description: 'The ID of the model to give feedback on',
    }),
    feedback: Property.StaticDropdown({
      displayName: 'Feedback Type',
      required: true,
      options: {
        options: [
          { label: 'Thumbs Up', value: 'thumbs_up' },
          { label: 'Thumbs Down', value: 'thumbs_down' },
          { label: 'Accepted', value: 'accepted' },
          { label: 'Rejected', value: 'rejected' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api.zoo.dev/user/text-to-cad/${propsValue.modelId}`,
      headers: {
        Authorization: `Bearer ${auth}`,
      },
      body: {
        feedback: propsValue.feedback,
      },
    });
    return response.body;
  },
});
