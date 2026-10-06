import { createAction, Property } from '@activepieces/pieces-framework';

import { googleTranslateAuth } from '../auth';
import { GoogleTranslateApi } from '../common/client';
import { detectLanguageOutputSchema } from '../output-schemas';

export const detectLanguage = createAction({
  name: 'detectLanguage',
  classification: 'READ',
  displayName: 'Detect Language',
  description: 'Detect the language of a text with Google Cloud Translation',
  audience: 'both',
  aiMetadata: {
    description:
      "Detects the language of a text and returns Google's top guess as a language code with a 0 to 1 confidence. Use before branching on language; to translate, call Translate text directly since it detects the source on its own. Read only, safe to retry.",
    idempotent: true,
  },
  outputSchema: detectLanguageOutputSchema,
  auth: googleTranslateAuth,
  props: {
    text: Property.LongText({
      displayName: 'Text',
      description: 'Text whose language should be detected.',
      required: true,
    }),
  },
  async run(context) {
    const [detection] = await GoogleTranslateApi.detect({
      accessToken: context.auth.access_token,
      q: context.propsValue.text,
    });

    if (!detection) {
      throw new Error('Google Translate could not detect a language for the given text.');
    }

    return {
      language: detection.language,
      confidence: detection.confidence ?? null,
    };
  },
});
