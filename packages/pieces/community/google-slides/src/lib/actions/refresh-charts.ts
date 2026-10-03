import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccessToken, googleSlidesAuth } from '../auth';
import { slidesApi } from '../commons/common';
import { slidesIds } from '../commons/ids';
import { slidesText } from '../commons/presentation-text';
import { FIELD_MASKS } from '../commons/requests';
import { refreshSheetsChartsOutputSchema } from '../output-schemas';

export const refreshSheetsCharts = createAction({
  name: 'refresh_sheets_charts',
  classification: 'WRITE',
  displayName: 'Refresh Sheets Charts',
  description: 'Refresh all Google Sheets charts in the presentation',
  audience: 'both',
  aiMetadata: {
    description:
      "Re-sync every embedded Google Sheets chart in a presentation (including charts inside groups) to its source spreadsheet's current data, in a single batch update. Use this after the underlying Sheets data changes to bring the slide charts up to date. Not idempotent: each call issues a fresh refresh against live spreadsheet data, so repeated calls can pull different chart contents. Accepts the presentation ID or URL; returns success false (not an error) when the deck has no linked charts.",
    idempotent: false,
  },
  auth: googleSlidesAuth,
  outputSchema: refreshSheetsChartsOutputSchema,
  props: {
    presentation_id: Property.ShortText({
      displayName: 'Presentation ID',
      description: 'The presentation ID (between /d/ and /edit in its URL), or the full URL.',
      required: true,
    }),
  },
  async run(context) {
    const presentationId = slidesIds.parsePresentationId(context.propsValue.presentation_id);
    const accessToken = await getAccessToken(context.auth);
    try {
      const presentation = await slidesApi.getPresentation({
        accessToken,
        presentationId,
        fields: FIELD_MASKS.charts,
      });
      const requests = slidesText
        .findSheetsCharts(presentation)
        .map((objectId) => ({ refreshSheetsChart: { objectId } }));

      if (requests.length === 0) {
        return {
          success: false,
          message: 'No Google Sheets charts found in the presentation',
        };
      }
      const result = await slidesApi.batchUpdate({
        accessToken,
        presentationId,
        requests,
        requiredRevisionId: presentation.revisionId,
      });
      return {
        success: true,
        message: `Successfully refreshed ${requests.length} Google Sheets charts`,
        result,
      };
    } catch (error) {
      throw slidesApi.googleApiError({ error, action: 'refresh the Sheets charts' });
    }
  },
});
