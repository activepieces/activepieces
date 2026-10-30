import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccessToken, googleSlidesAuth } from '../auth';
import { slidesApi } from '../commons/common';
import { slidesElementRequests } from '../commons/element-requests';
import { slidesElements, VIDEO_SOURCES } from '../commons/elements';
import { slidesIds } from '../commons/ids';
import { slidesProps } from '../commons/props';
import { slidesRequests } from '../commons/requests';
import { insertVideoOutputSchema } from '../output-schemas';

export const insertVideo = createAction({
  auth: googleSlidesAuth,
  name: 'insert_video',
  classification: 'WRITE',
  displayName: 'Insert Video',
  description: 'Embed a YouTube or Google Drive video on a slide.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Embed a YouTube video or a Google Drive video file on one slide, from its URL (youtube.com/watch?v=…, youtu.be/…, drive.google.com/file/d/…) or its ID, optionally at X/Y with Width/Height in points. A Drive video must be viewable by the connected account. Not idempotent: each call adds another video.',
    idempotent: false,
  },
  outputSchema: insertVideoOutputSchema,
  props: {
    presentation_id: slidesProps.presentationIdProp(),
    slide_number: slidesProps.slideNumberProp(),
    slide_object_id: slidesProps.slideObjectIdProp(),
    video: Property.ShortText({
      displayName: 'Video',
      description: 'YouTube or Google Drive video URL, or the video ID.',
      required: true,
    }),
    source: slidesProps.enumProp({
      displayName: 'Source',
      description: 'Only needed for a bare Drive file ID: DRIVE. YouTube IDs and URLs are detected.',
      values: VIDEO_SOURCES,
    }),
    x: slidesProps.pointProp({ displayName: 'X (pt)', description: 'Distance from the left edge, in points. Set together with Y.', required: false }),
    y: slidesProps.pointProp({ displayName: 'Y (pt)', description: 'Distance from the top edge, in points. Set together with X.', required: false }),
    width: slidesProps.pointProp({ displayName: 'Width (pt)', description: 'Width in points. Set together with Height.', required: false }),
    height: slidesProps.pointProp({ displayName: 'Height (pt)', description: 'Height in points. Set together with Width.', required: false }),
  },
  async run(context) {
    const { propsValue } = context;
    const presentationId = slidesIds.parsePresentationId(propsValue.presentation_id);
    const selector = slidesRequests.readSlideSelector({
      slideNumber: propsValue.slide_number,
      slideObjectId: propsValue.slide_object_id,
    });
    const video = slidesElements.readVideo({ value: propsValue.video, source: propsValue.source });
    const box = slidesElements.readBox({ x: propsValue.x, y: propsValue.y, width: propsValue.width, height: propsValue.height, required: false });
    const objectId = slidesIds.generateObjectId('video');
    const accessToken = await getAccessToken(context.auth);
    const action = 'insert the video';
    const { objectId: slideObjectId, revisionId } = await slidesRequests
      .lookupSlide({ accessToken, presentationId, selector })
      .catch((error: unknown) => {
        throw slidesApi.googleApiError({ error, action });
      });
    await slidesElements.applyRequests({
      accessToken,
      presentationId,
      requests: [slidesElementRequests.buildCreateVideoRequest({ objectId, slideObjectId, video, box })],
      revisionId,
      action,
    });
    return { presentationId, slideObjectId, videoObjectId: objectId, source: video.source, videoId: video.id };
  },
});
