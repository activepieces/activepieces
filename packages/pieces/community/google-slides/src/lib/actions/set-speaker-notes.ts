import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccessToken, googleSlidesAuth } from '../auth';
import { slidesApi } from '../commons/common';
import { slidesIds } from '../commons/ids';
import { slidesText } from '../commons/presentation-text';
import { slidesProps } from '../commons/props';
import { FIELD_MASKS, slidesRequests } from '../commons/requests';
import { setSpeakerNotesOutputSchema } from '../output-schemas';

export const setSpeakerNotes = createAction({
  auth: googleSlidesAuth,
  name: 'set_speaker_notes',
  classification: 'WRITE',
  displayName: 'Set Speaker Notes',
  description: 'Replace the speaker notes of a slide.',
  audience: 'both',
  aiMetadata: {
    description:
      'Set the speaker notes of one slide (by number or object ID) to the given text, replacing whatever notes it had; to remove the notes turn on Clear Notes instead of passing text. Use it to write talk tracks or presenter instructions; read the current notes with Get Presentation Outline. Idempotent: the notes end up as the given text no matter how often it runs.',
    idempotent: true,
  },
  outputSchema: setSpeakerNotesOutputSchema,
  props: {
    presentation_id: slidesProps.presentationIdProp(),
    slide_number: slidesProps.slideNumberProp(),
    slide_object_id: slidesProps.slideObjectIdProp(),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'The new speaker notes. They replace the current notes.',
      required: false,
    }),
    clear_notes: Property.Checkbox({
      displayName: 'Clear Notes',
      description: 'Turn on to remove the slide\'s speaker notes. Leave Notes empty when using this.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const presentationId = slidesIds.parsePresentationId(context.propsValue.presentation_id);
    const selector = slidesRequests.readSlideSelector({
      slideNumber: context.propsValue.slide_number,
      slideObjectId: context.propsValue.slide_object_id,
    });
    const notes = context.propsValue.notes ?? '';
    const clearNotes = context.propsValue.clear_notes === true;
    if (clearNotes && notes !== '') {
      throw new Error('Set either Notes or Clear Notes, not both.');
    }
    if (!clearNotes && notes === '') {
      throw new Error('Notes is empty. Enter the notes text, or turn on Clear Notes to remove the notes.');
    }
    const accessToken = await getAccessToken(context.auth);
    const action = 'set the speaker notes';
    const presentation = await slidesApi
      .getPresentation({ accessToken, presentationId, fields: FIELD_MASKS.speakerNotes })
      .catch((error: unknown) => {
        throw slidesApi.googleApiError({ error, action });
      });
    const slides = presentation.slides ?? [];
    const slide = slides[slidesRequests.resolveSlide({ slides, selector }).index];
    const speakerNotesObjectId = slide.slideProperties?.notesPage?.notesProperties?.speakerNotesObjectId;
    if (!speakerNotesObjectId) {
      throw new Error('Google returned no speaker notes area (speakerNotesObjectId) for this slide.');
    }
    const requests = slidesRequests.buildSpeakerNotesRequests({
      speakerNotesObjectId,
      currentNotes: slidesText.speakerNotesText(slide),
      notes,
    });
    if (requests.length > 0) {
      await slidesApi
        .batchUpdate({ accessToken, presentationId, requests, requiredRevisionId: presentation.revisionId })
        .catch((error: unknown) => {
          throw slidesApi.googleApiError({ error, action });
        });
    }
    return {
      presentationId,
      slideObjectId: slide.objectId,
      speakerNotesObjectId,
      speakerNotes: notes,
      changed: requests.length > 0,
    };
  },
});
