import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { detectingAiAuth, BASE_URL } from '../common';

export const humanizeText = createAction({
  name: 'humanize_text',
  displayName: 'Humanize Text',
  description: 'Humanize text to make it sound more natural',
  auth: detectingAiAuth,
  requireAuth: true,
  props: {
    text: Property.LongText({
      displayName: 'Text',
      required: true,
    }),
    model: Property.StaticDropdown({
      displayName: 'Model',
      required: true,
      options: {
        options: [
          {
            label: 'cognia',
            value: 'cognia',
          },
          {
            label: 'lexi',
            value: 'lexi',
          },
        ],
      },
      defaultValue: 'lexi',
    }),
  },
  async run({ auth, propsValue }) {
    const apiKey = auth.secret_text;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${BASE_URL}/api/humanize/`,
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: {
        text: propsValue.text,
        model: propsValue.model,
      },
    });

    return response.body;
  },
});
