import { createAction } from '@activepieces/pieces-framework';
import { ListTranscriptParams } from 'assemblyai';
import { assemblyaiAuth } from '../../auth';
import { getAssemblyAIClient } from '../../client';
import { props } from '../../generated/list-transcript/props';

export const listTranscripts = createAction({
  name: 'listTranscripts',
  auth: assemblyaiAuth,
  requireAuth: true,
  displayName: 'List transcripts',
  description: `Retrieve a list of transcripts you created.
Transcripts are sorted from newest to oldest. The previous URL always points to a page with older transcripts.`,
  props,
  async run(context) {
    const client = getAssemblyAIClient(context);
    const transcriptListResponse = await client.transcripts.list(
      context.propsValue as ListTranscriptParams
    );
    return transcriptListResponse;
  },
});
