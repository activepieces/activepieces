import { createAction } from '@activepieces/pieces-framework';
import { getAccessToken, googleSlidesAuth } from '../auth';
import { slidesApi } from '../commons/common';
import { slidesIds } from '../commons/ids';
import { slidesProps } from '../commons/props';
import { FIELD_MASKS, slidesRequests } from '../commons/requests';
import { deleteSlideOutputSchema } from '../output-schemas';

export const deleteSlide = createAction({
  auth: googleSlidesAuth,
  name: 'delete_slide',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Slide',
  description: 'Delete a slide from the presentation.',
  audience: 'both',
  aiMetadata: {
    description:
      'Delete one slide, chosen by slide number or slide object ID (only slides, never other elements). Use it to remove a slide from a deck; it can only be undone from the version history in Google Slides. Not idempotent: a repeat by object ID fails because the slide is gone, and a repeat by slide number deletes the next slide, so prefer the object ID.',
    idempotent: false,
  },
  outputSchema: deleteSlideOutputSchema,
  props: {
    presentation_id: slidesProps.presentationIdProp(),
    slide_number: slidesProps.slideNumberProp(),
    slide_object_id: slidesProps.slideObjectIdProp(),
  },
  async run(context) {
    const presentationId = slidesIds.parsePresentationId(context.propsValue.presentation_id);
    const selector = slidesRequests.readSlideSelector({
      slideNumber: context.propsValue.slide_number,
      slideObjectId: context.propsValue.slide_object_id,
    });
    const accessToken = await getAccessToken(context.auth);
    const action = 'delete the slide';
    const presentation = await slidesApi
      .getPresentation({ accessToken, presentationId, fields: FIELD_MASKS.slideIds })
      .catch((error: unknown) => {
        throw slidesApi.googleApiError({ error, action });
      });
    const slides = presentation.slides ?? [];
    const slide = slidesRequests.resolveSlide({ slides, selector });
    await slidesApi
      .batchUpdate({
        accessToken,
        presentationId,
        requests: [{ deleteObject: { objectId: slide.objectId } }],
        requiredRevisionId: presentation.revisionId,
      })
      .catch((error: unknown) => {
        throw slidesApi.googleApiError({ error, action });
      });
    return {
      presentationId,
      deletedSlideObjectId: slide.objectId,
      deletedSlideNumber: slide.index + 1,
      remainingSlideCount: slides.length - 1,
    };
  },
});
