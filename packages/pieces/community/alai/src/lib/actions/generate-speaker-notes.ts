import { createAction, Property } from '@activepieces/pieces-framework';
import { alaiAuth } from '../common/auth';
import { alaiClient } from '../common/client';
import { alaiOutputSchemas } from '../common/output-schemas';
import { presentationIdProp } from './shared-props';

export const generateSpeakerNotes = createAction({
  auth: alaiAuth,
  name: 'generateSpeakerNotes',
  classification: 'WRITE',
  displayName: 'Generate Speaker Notes',
  description: 'Generate speaker notes for the slides of a presentation.',
  audience: 'human',
  outputSchema: alaiOutputSchemas.generation,
  aiMetadata: {
    description:
      'Starts AI speaker-notes generation for an Alai presentation, for all slides or only the given slide IDs. Uses AI credits per slide. By default returns at once with generation_id; set waitForCompletion to wait (max 480 s) and get transcripts (slide_id, slide_order, title, content). Not idempotent: each call starts a new job and uses credits again.',
    idempotent: false,
  },
  props: {
    presentationId: presentationIdProp('The presentation to write speaker notes for.'),
    slideIds: Property.Array({
      displayName: 'Slide IDs',
      description: 'Only these slides. Leave empty for all slides.',
      required: false,
    }),
    waitForCompletion: Property.Checkbox({
      displayName: 'Wait for Completion',
      description: 'Wait until Alai finishes. If off, use "Get Generation" with the returned ID later.',
      required: false,
      defaultValue: false,
    }),
    maxWaitTime: Property.Number({
      displayName: 'Max Wait Time (seconds)',
      description: 'How long to wait when waiting is on. Default 300, capped at 480.',
      required: false,
      defaultValue: 300,
    }),
  },
  async run({ auth, propsValue }) {
    const presentationId = alaiClient.pathId({ value: propsValue.presentationId, label: 'Presentation ID' });
    const slideIds = (propsValue.slideIds ?? []).map((id) => String(id).trim()).filter((id) => id.length > 0);
    return alaiClient.startGeneration({
      apiKey: auth.props.apiKey,
      path: `/presentations/${presentationId}/transcripts`,
      body: slideIds.length > 0 ? { slide_ids: slideIds } : {},
      waitForCompletion: propsValue.waitForCompletion,
      maxWaitTime: propsValue.maxWaitTime,
      requestedFormats: [],
    });
  },
});
