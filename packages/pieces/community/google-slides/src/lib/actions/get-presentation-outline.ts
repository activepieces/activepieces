import { createAction } from '@activepieces/pieces-framework';
import { getAccessToken, googleSlidesAuth } from '../auth';
import { slidesApi } from '../commons/common';
import { slidesIds } from '../commons/ids';
import { slidesText } from '../commons/presentation-text';
import { slidesProps } from '../commons/props';
import { FIELD_MASKS } from '../commons/requests';
import { getPresentationOutlineOutputSchema } from '../output-schemas';

export const getPresentationOutline = createAction({
  auth: googleSlidesAuth,
  name: 'get_presentation_outline',
  classification: 'READ',
  displayName: 'Get Presentation Outline',
  description: "Get each slide's number, object ID, title, text and speaker notes.",
  audience: 'both',
  aiMetadata: {
    description:
      'Read a compact outline of a Google Slides presentation: for every slide its number, object ID, layout, title, all text (including grouped shapes and table cells), speaker notes, and the object IDs of its elements. Pick this to summarise a deck or to find the slide and element object IDs other Slides actions need; use List Slide Elements for positions and sizes, and Get Presentation only when you need raw element detail. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: getPresentationOutlineOutputSchema,
  props: {
    presentation_id: slidesProps.presentationIdProp(),
  },
  async run(context) {
    const presentationId = slidesIds.parsePresentationId(context.propsValue.presentation_id);
    const accessToken = await getAccessToken(context.auth);
    const presentation = await slidesApi
      .getPresentation({ accessToken, presentationId, fields: FIELD_MASKS.outline })
      .catch((error: unknown) => {
        throw slidesApi.googleApiError({ error, action: 'read the presentation outline' });
      });
    const outline = slidesText.buildOutline(presentation);
    return {
      presentationId: outline.presentationId,
      title: outline.title,
      presentationUrl: slidesApi.presentationUrl(outline.presentationId),
      revisionId: outline.revisionId,
      slideCount: outline.slideCount,
      slides: outline.slides,
    };
  },
});
