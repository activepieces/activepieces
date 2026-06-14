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
  audience: 'both',
  aiMetadata: {
    description:
      'Lists transcripts you have created, newest first, with paging support. Use this to discover transcript IDs or browse past transcription jobs when you do not already have a specific ID. Read-only and idempotent.',
    idempotent: true,
  },
  props,
  async run(context) {
    const client = getAssemblyAIClient(context);
    const transcriptListResponse = await client.transcripts.list(
      context.propsValue as ListTranscriptParams
    );
    return transcriptListResponse;
  },
});
