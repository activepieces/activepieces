import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { typeformAuth } from '../auth';
import { typeformCommon, TypeformRecord } from '../common';
import { themeOutputSchema } from '../output-schemas';

export const getThemeAction = createAction({
  auth: typeformAuth,
  name: 'get_theme',
  classification: 'READ',
  displayName: 'Get Theme',
  description: 'Gets a theme with its colors, font and layout.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Get one Typeform theme by ID with its name, font, colors, question and screen alignment and font size, background and visibility. Read-only.',
    idempotent: true,
  },
  outputSchema: themeOutputSchema,
  props: {
    themeId: typeformCommon.requiredThemeId,
  },
  async run({ auth, propsValue }) {
    return typeformCommon.typeformRequest<TypeformRecord>({
      token: auth.access_token,
      method: HttpMethod.GET,
      path: `/themes/${encodeURIComponent(propsValue.themeId.trim())}`,
    });
  },
});
