import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccessToken, googleSlidesAuth } from '../auth';
import { slidesApi } from '../commons/common';
import { slidesIds } from '../commons/ids';
import { getPresentationOutputSchema } from '../output-schemas';

export const getPresentation = createAction({
  name: 'get_presentation',
  classification: 'READ',
  displayName: 'Get Presentation',
  description: 'Get all slides from a presentation',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetch the raw Google Slides presentation resource (title, page size, slides with every page element, layouts, masters). Use it when you need element-level detail such as transforms, styles or table structure; for slide text, speaker notes and object IDs prefer Get Presentation Outline, which is far smaller. An optional Google field mask (e.g. "presentationId,title,slides(objectId)") trims the response. Accepts the presentation ID or URL. Read-only and idempotent.',
    idempotent: true,
  },
  auth: googleSlidesAuth,
  outputSchema: getPresentationOutputSchema,
  props: {
    presentation_id: Property.ShortText({
      displayName: 'Presentation ID',
      description: 'The presentation ID (between /d/ and /edit in its URL), or the full URL.',
      required: true,
    }),
    fields: Property.ShortText({
      displayName: 'Fields',
      description:
        'Optional Google field mask to return only part of the presentation, e.g. presentationId,title,slides(objectId). Leave empty for the full presentation.',
      required: false,
    }),
  },
  async run(context) {
    const presentationId = slidesIds.parsePresentationId(context.propsValue.presentation_id);
    const fields = context.propsValue.fields?.trim() || undefined;
    const accessToken = await getAccessToken(context.auth);
    try {
      return await slidesApi.getPresentation({ accessToken, presentationId, fields });
    } catch (error) {
      throw slidesApi.googleApiError({ error, action: 'get the presentation' });
    }
  },
});
