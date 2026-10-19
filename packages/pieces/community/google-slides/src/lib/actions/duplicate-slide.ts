import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccessToken, googleSlidesAuth } from '../auth';
import { slidesApi } from '../commons/common';
import { slidesIds } from '../commons/ids';
import { slidesProps } from '../commons/props';
import { FIELD_MASKS, slidesRequests } from '../commons/requests';
import { duplicateSlideOutputSchema } from '../output-schemas';

export const duplicateSlide = createAction({
  auth: googleSlidesAuth,
  name: 'duplicate_slide',
  classification: 'WRITE',
  displayName: 'Duplicate Slide',
  description: 'Copy a slide within the same presentation.',
  audience: 'both',
  aiMetadata: {
    description:
      'Duplicate one slide (by number or object ID) inside the same presentation, with all its elements; the copy goes right after the original or at a chosen 1-based position. Use it to reuse a designed slide, then change the copy\'s text with Replace Text limited to the new slide ID. Not idempotent: each call adds another copy.',
    idempotent: false,
  },
  outputSchema: duplicateSlideOutputSchema,
  props: {
    presentation_id: slidesProps.presentationIdProp(),
    slide_number: slidesProps.slideNumberProp(),
    slide_object_id: slidesProps.slideObjectIdProp(),
    position: Property.Number({
      displayName: 'Position of the Copy',
      description: 'Where to put the copy, starting at 1. Leave empty to place it right after the original.',
      required: false,
    }),
  },
  async run(context) {
    const presentationId = slidesIds.parsePresentationId(context.propsValue.presentation_id);
    const selector = slidesRequests.readSlideSelector({
      slideNumber: context.propsValue.slide_number,
      slideObjectId: context.propsValue.slide_object_id,
    });
    const accessToken = await getAccessToken(context.auth);
    const action = 'duplicate the slide';
    const presentation = await slidesApi
      .getPresentation({ accessToken, presentationId, fields: FIELD_MASKS.slideIds })
      .catch((error: unknown) => {
        throw slidesApi.googleApiError({ error, action });
      });
    const slides = presentation.slides ?? [];
    const source = slidesRequests.resolveSlide({ slides, selector });
    const targetIndex = slidesRequests.readPosition({
      position: context.propsValue.position,
      maxPosition: slides.length + 1,
    });
    const newObjectId = slidesIds.generateObjectId('slide');
    const { requests, finalIndex } = slidesRequests.buildDuplicateRequests({
      sourceObjectId: source.objectId,
      sourceIndex: source.index,
      newObjectId,
      targetIndex,
    });
    await slidesApi
      .batchUpdate({ accessToken, presentationId, requests, requiredRevisionId: presentation.revisionId })
      .catch((error: unknown) => {
        throw slidesApi.googleApiError({ error, action });
      });
    return {
      presentationId,
      sourceSlideObjectId: source.objectId,
      slideObjectId: newObjectId,
      slideNumber: finalIndex + 1,
      slideUrl: slidesApi.slideUrl({ presentationId, slideObjectId: newObjectId }),
    };
  },
});
