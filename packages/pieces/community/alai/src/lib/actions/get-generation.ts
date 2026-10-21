import { createAction, Property } from '@activepieces/pieces-framework';
import { alaiAuth } from '../common/auth';
import { alaiClient } from '../common/client';
import { alaiOutputSchemas } from '../common/output-schemas';

export const getGeneration = createAction({
  auth: alaiAuth,
  name: 'getGeneration',
  classification: 'READ',
  displayName: 'Get Generation',
  description: 'Get the status and result of a generation, slide, export or speaker-notes job.',
  audience: 'both',
  outputSchema: alaiOutputSchemas.generation,
  aiMetadata: {
    description:
      'Reads the status of an Alai job by generation_id (from Generate Presentation, Add Slide, Export Presentation or Generate Speaker Notes). Returns status (pending, in_progress, completed, failed), presentation_id, slide_id, link/pdf/ppt URLs (signed, valid about 24 h) and speaker notes when ready. Poll it about every 5 seconds until status is completed or failed. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    generationId: Property.ShortText({
      displayName: 'Generation ID',
      description: 'The generation_id returned by another Alai action.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return alaiClient.getGeneration({ apiKey: auth.props.apiKey, generationId: propsValue.generationId });
  },
});
