import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { typeformAuth } from '../auth';
import { typeformCommon, TypeformRecord } from '../common';
import { deleteThemeOutputSchema } from '../output-schemas';

export const deleteThemeAction = createAction({
  auth: typeformAuth,
  name: 'delete_theme',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Theme',
  description: 'Deletes a custom theme.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Delete a private Typeform theme. Typeform's public preset themes cannot be deleted. Cannot be undone; confirm with the user first.",
    idempotent: false,
  },
  outputSchema: deleteThemeOutputSchema,
  props: {
    themeId: typeformCommon.requiredThemeId,
  },
  async run({ auth, propsValue }) {
    const path = `/themes/${encodeURIComponent(propsValue.themeId.trim())}`;
    const current = await typeformCommon.typeformRequest<TypeformRecord>({
      token: auth.access_token,
      method: HttpMethod.GET,
      path,
    });
    if (current['visibility'] === 'public') {
      throw new Error("This is one of Typeform's public themes and cannot be deleted.");
    }
    await typeformCommon.typeformRequest<unknown>({
      token: auth.access_token,
      method: HttpMethod.DELETE,
      path,
    });
    return { deleted: true, theme_id: propsValue.themeId.trim() };
  },
});
