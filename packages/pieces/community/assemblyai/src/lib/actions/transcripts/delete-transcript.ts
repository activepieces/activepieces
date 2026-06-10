import { createAction } from '@activepieces/pieces-framework';
import { assemblyaiAuth } from '../../auth';
import { getAssemblyAIClient } from '../../client';
import { transcriptIdProp } from './shared-props';

export const deleteTranscript = createAction({
  name: 'deleteTranscript',
  auth: assemblyaiAuth,
  requireAuth: true,
  displayName: 'Delete transcript',
  description: 'Remove the data from the transcript and mark it as deleted.',
  audience: 'both',
  aiMetadata: {
    description:
      "Permanently removes the data of an existing transcript, identified by its ID, and marks it deleted. Use this to purge a transcript's contents; this is a destructive mutation. Requires a valid transcript ID. Repeating the call after deletion does not restore data, but it changes server state on the first successful call, so it is not idempotent.",
    idempotent: false,
  },
  props: {
    id: transcriptIdProp,
  },
  async run(context) {
    const client = getAssemblyAIClient(context);
    const deleteResponse = await client.transcripts.delete(
      context.propsValue.id
    );
    return deleteResponse;
  },
});
