import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { detectingAiAuth, BASE_URL } from '../common';

export const detectAiContent = createAction({
  name: 'detect_ai_content',
  displayName: 'Detect AI Content',
  description: 'Detect AI-generated content in text',
  audience: 'both',
  aiMetadata: { description: 'Analyzes a block of text and scores how likely it was AI-generated, using the DetectingAI detection API. Use to verify whether submitted or scraped content is human-written vs. machine-generated. Requires the text to check; a detection-model version (v1 or v2) can be selected. Read-only analysis — calling it again with the same text returns the same assessment without side effects.', idempotent: true },
  auth: detectingAiAuth,
  requireAuth: true,
  props: {
    text: Property.LongText({
      displayName: 'Text',
      required: true,
    }),
    version: Property.StaticDropdown({
      displayName: 'Version',
      required: true,
      options: {
        options: [
          {
            label: 'v1',
            value: 'v1',
          },
          {
            label: 'v2',
            value: 'v2',
          },
        ],
      },
      defaultValue: 'v2',
    }),
  },
  async run({ auth, propsValue }) {
    const apiKey = auth.secret_text;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${BASE_URL}/api/detect/`,
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: {
        text: propsValue.text,
        version: propsValue.version,
      },
    });

    return response.body;
  },
});
