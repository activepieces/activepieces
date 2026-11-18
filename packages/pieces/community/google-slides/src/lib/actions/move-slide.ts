import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccessToken, googleSlidesAuth } from '../auth';
import { slidesApi } from '../commons/common';
import { slidesIds } from '../commons/ids';
import { slidesProps } from '../commons/props';
import { FIELD_MASKS, slidesRequests } from '../commons/requests';
import { moveSlideOutputSchema } from '../output-schemas';

export const moveSlide = createAction({
  auth: googleSlidesAuth,
  name: 'move_slide',
  classification: 'WRITE',
  displayName: 'Move Slide',
  description: 'Move a slide to a new position in the presentation.',
  audience: 'both',
  aiMetadata: {
    description:
      'Move one slide (by number or object ID) so it ends up at the given 1-based position. Use it to reorder a deck. Not idempotent when the slide is chosen by number (after the first move that number points at another slide); by object ID a repeat to the same position changes nothing, so prefer the object ID.',
    idempotent: false,
  },
  outputSchema: moveSlideOutputSchema,
  props: {
    presentation_id: slidesProps.presentationIdProp(),
    slide_number: slidesProps.slideNumberProp(),
    slide_object_id: slidesProps.slideObjectIdProp(),
    position: Property.Number({
      displayName: 'New Position',
      description: 'Position the slide should end up at, starting at 1 for the first slide.',
      required: true,
    }),
  },
  async run(context) {
    const presentationId = slidesIds.parsePresentationId(context.propsValue.presentation_id);
    const selector = slidesRequests.readSlideSelector({
      slideNumber: context.propsValue.slide_number,
      slideObjectId: context.propsValue.slide_object_id,
    });
    const accessToken = await getAccessToken(context.auth);
    const action = 'move the slide';
    const presentation = await slidesApi
      .getPresentation({ accessToken, presentationId, fields: FIELD_MASKS.slideIds })
      .catch((error: unknown) => {
        throw slidesApi.googleApiError({ error, action });
      });
    const slides = presentation.slides ?? [];
    const slide = slidesRequests.resolveSlide({ slides, selector });
    const targetIndex = slidesRequests.readPosition({ position: context.propsValue.position, maxPosition: slides.length });
    if (targetIndex === undefined) {
      throw new Error('New Position is required.');
    }
    const moved = targetIndex !== slide.index;
    if (moved) {
      await slidesApi
        .batchUpdate({
          accessToken,
          presentationId,
          requests: [
            {
              updateSlidesPosition: {
                slideObjectIds: [slide.objectId],
                insertionIndex: slidesRequests.moveInsertionIndex({ currentIndex: slide.index, targetIndex }),
              },
            },
          ],
          requiredRevisionId: presentation.revisionId,
        })
        .catch((error: unknown) => {
          throw slidesApi.googleApiError({ error, action });
        });
    }
    return {
      presentationId,
      slideObjectId: slide.objectId,
      previousSlideNumber: slide.index + 1,
      slideNumber: targetIndex + 1,
      moved,
    };
  },
});
