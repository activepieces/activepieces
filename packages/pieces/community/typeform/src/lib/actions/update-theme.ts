import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { typeformAuth } from '../auth';
import { typeformCommon, TypeformRecord } from '../common';
import { themeOutputSchema } from '../output-schemas';

const THEME_KEYS = ['name', 'font', 'colors', 'fields', 'screens', 'background', 'has_transparent_button', 'rounded_corners'];

export const updateThemeAction = createAction({
  auth: typeformAuth,
  name: 'update_theme',
  classification: 'WRITE',
  displayName: 'Update Theme',
  description: 'Changes some settings of a custom theme.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Change a private Typeform theme's name, font, colors, alignment or font sizes; only the settings you set change. Typeform's public preset themes cannot be edited. All forms using the theme change with it. Returns the updated theme.",
    idempotent: true,
  },
  outputSchema: themeOutputSchema,
  props: {
    themeId: typeformCommon.requiredThemeId,
    ...typeformCommon.themeFields,
  },
  async run({ auth, propsValue }) {
    const path = `/themes/${encodeURIComponent(propsValue.themeId.trim())}`;
    const current = await typeformCommon.typeformRequest<TypeformRecord>({
      token: auth.access_token,
      method: HttpMethod.GET,
      path,
    });
    if (current['visibility'] === 'public') {
      throw new Error("This is one of Typeform's public themes and cannot be edited. Create your own with Create Theme.");
    }
    const changes = typeformCommon.themeBody({ values: propsValue, current });
    if (Object.keys(changes).length === 0) {
      throw new Error('Set at least one setting to change.');
    }
    const body = {
      ...Object.fromEntries(Object.entries(current).filter(([key]) => THEME_KEYS.includes(key))),
      ...changes,
    };
    return typeformCommon.typeformRequest<TypeformRecord>({
      token: auth.access_token,
      method: HttpMethod.PATCH,
      path,
      body,
    });
  },
});
