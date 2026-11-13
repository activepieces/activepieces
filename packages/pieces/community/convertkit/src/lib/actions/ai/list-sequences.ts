import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { convertkitAuth } from '../../auth';
import { kitClient } from '../../common/client';
import { Sequence } from '../../common/types';
import { kitListSequencesOutputSchema } from '../../output-schemas';

export const kitListSequences = createAction({
  auth: convertkitAuth,
  name: 'kit_list_sequences',
  classification: 'SEARCH',
  outputSchema: kitListSequencesOutputSchema,
  displayName: 'List Sequences',
  description: 'List the email sequences on the account.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists all sequences (automated email courses) with their ID and name. Use it to find a sequence ID for a sequence webhook or enrolment.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const response = await kitClient.request<{ courses: Sequence[] }>({
      apiSecret: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/sequences',
    });
    const sequences = response.body.courses ?? [];
    return { sequences, count: sequences.length };
  },
});
