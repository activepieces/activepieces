import { createAction } from '@activepieces/pieces-framework';
import { ListTranscriptParams } from 'assemblyai';
import { assemblyaiAuth } from '../../auth';
import { getAssemblyAIClient } from '../../client';
import { props } from '../../generated/list-transcript/props';

export const listTranscripts = createAction({
  name: 'listTranscripts',
  classification: 'SEARCH',
  auth: assemblyaiAuth,
  requireAuth: true,
  displayName: 'List Transcripts',
  description: 'List your transcripts, newest first.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists transcripts you have created, newest first, with paging support. Use this to discover transcript IDs or browse past transcription jobs when you do not already have a specific ID. Read-only and idempotent.',
    idempotent: true,
  },
  props,
  propertyGroups: [
    {
      key: 'status',
      display: 'builder',
      label: 'Status',
      icon: 'filter',
      props: ['status', 'throttled_only'],
    },
    {
      key: 'date',
      display: 'builder',
      label: 'Date',
      icon: 'calendar',
      props: ['created_on'],
    },
    {
      key: 'position',
      display: 'builder',
      label: 'Position',
      icon: 'tag',
      props: ['before_id', 'after_id'],
    },
    { key: 'footer', display: 'footer', props: ['limit'] },
  ],
  async run(context) {
    const client = getAssemblyAIClient(context);
    const transcriptListResponse = await client.transcripts.list(
      context.propsValue as ListTranscriptParams
    );
    return transcriptListResponse;
  },
});
