import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { flipandoAuth } from '../common/auth';
import { BASE_URL, makeRequest } from '../common/client';

export const runAppGenerator = createAction({
  auth: flipandoAuth,
  name: 'runAppGenerator',
  displayName: 'Run App Generator',
  description:
    "Triggers the execution of Flipando's Special App Generator, initiating a background job for application completion.",
  props: {
    inputs_data: Property.LongText({
      displayName: 'Inputs Data',
      description:
        'JSON string of key-value pairs for application input variables.',
      required: false,
    }),
    is_new_app_private: Property.Checkbox({
      displayName: 'Is New App Private',
      description:
        'Whether the new app to be created should be private or public.',
      required: true,
      defaultValue: true,
    }),
  },
  async run(context) {
    const apiKey = context.auth.secret_text;
    const inputsData = context.propsValue.inputs_data;
    const isNewAppPrivate = context.propsValue.is_new_app_private;

    const formData = new FormData();
    if (inputsData) {
      formData.append('inputs_data', inputsData);
    }
    formData.append('is_new_app_private', String(isNewAppPrivate));

    return await makeRequest(
      apiKey,
      HttpMethod.POST,
      '/integrations/applications/app-generator/completion',
      undefined,
      formData
    );
  },
});
