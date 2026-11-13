import { createAction, Property } from '@activepieces/pieces-framework';
import { parseurAuth } from '../../auth';
import { parseurAiProps } from '../../common/ai-props';
import { parseurApi } from '../../common/api';
import { parseurUtils } from '../../common/utils';
import { mailboxListOutputSchema } from '../../output-schemas';

const ORDERING_OPTIONS = [
  'name',
  '-name',
  'document_count',
  '-document_count',
  'template_count',
  '-template_count',
  'PARSEDOK_count',
  '-PARSEDOK_count',
  'PARSEDKO_count',
  '-PARSEDKO_count',
  'QUOTAEXC_count',
  '-QUOTAEXC_count',
  'EXPORTKO_count',
  '-EXPORTKO_count',
  'TRANSKO_count',
  '-TRANSKO_count',
].map((value) => ({ label: value, value }));

export const listMailboxesAction = createAction({
  auth: parseurAuth,
  name: 'parseur_list_mailboxes',
  outputSchema: mailboxListOutputSchema,
  displayName: 'List Mailboxes',
  description: 'Lists the mailboxes (parsers) in the account.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the Parseur mailboxes (parsers) in the account with their ID, name, email_prefix and document counts per status. Use it to find the mailbox ID every other mailbox, document and template action takes.',
    idempotent: true,
  },
  props: {
    search: parseurAiProps.search({
      required: false,
      description: 'Case-insensitive partial match on the mailbox name.',
    }),
    ordering: Property.StaticDropdown({
      displayName: 'Ordering',
      description: 'Sort field; a leading "-" sorts descending.',
      required: false,
      options: { disabled: false, options: ORDERING_OPTIONS },
    }),
    page: parseurAiProps.page({ required: false }),
    limit: parseurAiProps.limit({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await parseurApi.listMailboxes({
      auth,
      query: {
        search: propsValue.search,
        ordering: propsValue.ordering,
        ...parseurUtils.pageQuery({
          page: propsValue.page,
          limit: propsValue.limit,
        }),
      },
    });
  },
});
