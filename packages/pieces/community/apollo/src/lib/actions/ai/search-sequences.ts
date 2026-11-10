import { createAction } from '@activepieces/pieces-framework';
import { apolloAuth } from '../../auth';
import { apiKeyOf, recordsOf } from '../../common/client';
import { aiProps, apolloInputs } from '../../common/ai-props';
import { apolloOutputSchemas } from '../../common/output-schemas';
import { apolloMappers, apolloRequests } from '../../common/requests';

export const aiSearchSequencesAction = createAction({
  auth: apolloAuth,
  name: 'ai_search_sequences',
  classification: 'SEARCH',
  displayName: 'Search Sequences',
  description: 'Search the sequences in your Apollo workspace.',
  audience: 'ai',
  aiMetadata: {
    description: 'Searches your Apollo sequences (outreach campaigns) by part of the name, returning ID, active/archived state, step count and delivery stats. Use the ID with Add Contacts to Sequence and Stop or Remove Contacts from Sequence. Uses no credits; needs a paid Apollo plan.',
    idempotent: true,
  },
  props: {
    name: aiProps.text({ displayName: 'Name Contains', description: 'Part of the sequence name.', required: false }),
    page: aiProps.page(),
    per_page: aiProps.perPage({ max: 100, fallback: 25 }),
  },
  outputSchema: apolloOutputSchemas.sequenceSearch,
  async run({ propsValue, auth }) {
    const { page, perPage } = apolloInputs.pageParams({ page: propsValue.page, perPage: propsValue.per_page, maxPerPage: 100, defaultPerPage: 25 });
    const body = await apolloRequests.searchSequences({ apiKey: apiKeyOf(auth), query: { q_name: apolloInputs.optionalText(propsValue.name), page, per_page: perPage } });
    const sequences = recordsOf(body['emailer_campaigns']).map((sequence) => apolloMappers.sequence(sequence));
    return { ...apolloMappers.pageInfo({ body, page, perPage, returned: sequences.length }), sequences };
  },
});
