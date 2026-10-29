import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { alaiAuth } from '../common/auth';
import { alaiClient } from '../common/client';
import { alaiOutputSchemas } from '../common/output-schemas';
import { presentationIdProp } from './shared-props';

export const deleteSlide = createAction({
  auth: alaiAuth,
  name: 'deleteSlide',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Slide',
  description: 'Permanently delete one slide from a presentation.',
  audience: 'both',
  outputSchema: alaiOutputSchemas.deleteSlide,
  aiMetadata: {
    description:
      'Permanently deletes one slide from an Alai presentation by presentation ID and slide ID (slide_id from Add Slide or from speaker-notes transcripts); this cannot be undone. Fails with a not-found error if the slide does not exist, so a repeated call errors.',
    idempotent: false,
  },
  props: {
    presentationId: presentationIdProp('The presentation that contains the slide.'),
    slideId: Property.ShortText({
      displayName: 'Slide ID',
      description: 'The slide_id from "Add Slide" or from "Generate Speaker Notes".',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const presentationId = alaiClient.pathId({ value: propsValue.presentationId, label: 'Presentation ID' });
    const slideId = alaiClient.pathId({ value: propsValue.slideId, label: 'Slide ID' });
    const body = await alaiClient.request<{ success?: boolean }>({
      apiKey: auth.props.apiKey,
      method: HttpMethod.DELETE,
      path: `/presentations/${presentationId}/slides/${slideId}`,
    });
    if (body?.success === false) {
      throw new Error(`Alai did not delete slide ${propsValue.slideId}.`);
    }
    return { success: true, presentation_id: propsValue.presentationId.trim(), slide_id: propsValue.slideId.trim() };
  },
});
