import { createAction } from '@activepieces/pieces-framework';
import { gmailAuth } from '../auth';
import { gmailSearchMailAction } from './search-email-action';
import { gmailAiSearchEmailActionOutputSchema } from '../output-schemas';

export const gmailAiSearchEmailAction = createAction({
  auth: gmailAuth,
  name: 'gmail_search_email',
  displayName: 'Search Email',
  description:
    'Search emails using advanced criteria. If no filters are provided, the latest emails are returned.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches the mailbox for emails matching combinable filters (sender, recipient, subject, body text, label, category, date range, attachment presence/name) and returns the matched messages with parsed contents and their message IDs. Use this as the primary resolver to locate messages or discover their message IDs before reading or replying to them; with no filters it returns the most recent emails. Bound results with Max Results (1-500, default 10). Idempotent: a read-only search that does not modify the mailbox.',
    idempotent: true,
  },
  outputSchema: gmailAiSearchEmailActionOutputSchema,
  props: gmailSearchMailAction.props,
  run: gmailSearchMailAction.run,
});
