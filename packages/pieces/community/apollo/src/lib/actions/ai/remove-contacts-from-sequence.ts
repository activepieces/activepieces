import { createAction } from '@activepieces/pieces-framework';
import { apolloAuth } from '../../auth';
import { apiKeyOf, isRecord } from '../../common/client';
import { aiProps, apolloInputs } from '../../common/ai-props';
import { apolloOutputSchemas } from '../../common/output-schemas';
import { apolloRequests } from '../../common/requests';

export const aiRemoveContactsFromSequenceAction = createAction({
  auth: apolloAuth,
  name: 'ai_remove_contacts_from_sequence',
  classification: 'DESTRUCTIVE',
  displayName: 'Stop or Remove Contacts from Sequence',
  description: 'Stop, finish or remove contacts in sequences.',
  audience: 'ai',
  aiMetadata: {
    description: 'Changes the sequence status of saved contacts in one or more Apollo sequences: remove takes them out, stop halts their remaining steps, mark_as_finished marks them finished. Apollo may apply it asynchronously and returns a job ID. Uses no credits.',
    idempotent: false,
  },
  props: {
    sequence_ids: aiProps.textList({ displayName: 'Sequence IDs', description: 'Sequence IDs from Search Sequences (field id).', required: true }),
    contact_ids: aiProps.textList({ displayName: 'Contact IDs', description: 'Contact IDs from Search Contacts (field id), up to 100.', required: true }),
    mode: aiProps.choice({
      displayName: 'Mode',
      description: 'remove, stop or mark_as_finished.',
      required: true,
      options: [
        { label: 'Remove from sequence', value: 'remove' },
        { label: 'Stop remaining steps', value: 'stop' },
        { label: 'Mark as finished', value: 'mark_as_finished' },
      ],
    }),
  },
  outputSchema: apolloOutputSchemas.sequenceRemove,
  async run({ propsValue, auth }) {
    const mode = apolloInputs.requireText({ value: propsValue.mode, label: 'Mode' });
    if (!['remove', 'stop', 'mark_as_finished'].includes(mode)) {
      throw new Error('Mode must be remove, stop or mark_as_finished.');
    }
    const sequenceIds = apolloInputs.requireStringList({ value: propsValue.sequence_ids, label: 'Sequence IDs', max: 100 });
    const contactIds = apolloInputs.requireStringList({ value: propsValue.contact_ids, label: 'Contact IDs', max: 100 });
    const body = await apolloRequests.removeOrStopContacts({ apiKey: apiKeyOf(auth), sequenceIds, contactIds, mode });
    const job = isRecord(body['entity_progress_job']) ? body['entity_progress_job'] : null;
    return { mode, sequence_ids: sequenceIds, contact_ids: contactIds, job_id: job !== null && job['id'] !== undefined ? String(job['id']) : null };
  },
});
