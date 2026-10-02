import { createAction } from '@activepieces/pieces-framework';
import { getAccessToken, googleSlidesAuth } from '../auth';
import { slidesApi } from '../commons/common';
import { slidesIds } from '../commons/ids';
import { slidesProps } from '../commons/props';
import { slidesRequests } from '../commons/requests';
import { getSlideOutputSchema } from '../output-schemas';

export const getSlide = createAction({
  auth: googleSlidesAuth,
  name: 'get_slide',
  classification: 'READ',
  displayName: 'Get Slide',
  description: 'Get one slide with all of its elements.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetch the raw Page resource of one slide (its page elements with sizes, transforms, text and styles, plus slide properties), chosen by slide number or slide object ID. Use it to inspect one slide in detail without loading the whole deck; for text only use Get Presentation Outline, and for positions and sizes in points use List Slide Elements. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: getSlideOutputSchema,
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
    try {
      const { objectId: pageObjectId } = await slidesRequests.lookupSlide({ accessToken, presentationId, selector });
      return await slidesApi.getPage({ accessToken, presentationId, pageObjectId });
    } catch (error) {
      throw slidesApi.googleApiError({ error, action: 'get the slide' });
    }
  },
});
