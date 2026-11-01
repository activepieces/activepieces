import { Property } from '@activepieces/pieces-framework';

export const transcriptIdProp = Property.ShortText({
  displayName: 'Transcript ID',
  description: 'Found in the output of the Transcribe step.',
  required: true,
});
