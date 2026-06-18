import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { detectingAiAuth, BASE_URL } from '../common';

export const checkPlagiarism = createAction({
  name: 'check_plagiarism',
  displayName: 'Check Plagiarism',
  description: 'Check text for plagiarism',
  audience: 'both',
  aiMetadata: { description: 'Scans a block of text against the DetectingAI plagiarism API to find matching or copied passages from external sources. Use to verify originality of submitted or generated content. Requires the text to check. Read-only analysis — repeating the call with the same text returns the same result with no side effects.', idempotent: true },
  auth: detectingAiAuth,
  requireAuth: true,
  props: {
    text: Property.LongText({
      displayName: 'Text',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const apiKey = auth.secret_text;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${BASE_URL}/api/plagiarism/`,
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: {
        text: propsValue.text,
      },
    });

    return response.body;
  },
});
