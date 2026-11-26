import { createAction } from '@activepieces/pieces-framework';
import { apolloAuth } from '../../auth';
import { apiKeyOf, recordsOf } from '../../common/client';
import { aiProps, apolloInputs } from '../../common/ai-props';
import { apolloOutputSchemas } from '../../common/output-schemas';
import { apolloMappers, apolloRequests } from '../../common/requests';

export const aiSearchOutreachEmailsAction = createAction({
  auth: apolloAuth,
  name: 'ai_search_outreach_emails',
  classification: 'SEARCH',
  displayName: 'Search Outreach Emails',
  description: 'Search the sequence emails your team sent or scheduled.',
  audience: 'ai',
  aiMetadata: {
    description: 'Searches emails your team created through Apollo sequences by keywords, sequence IDs, sender user IDs, status (e.g. delivered, scheduled, bounced, opened) and date range, returning subject, recipient, status, reply and failure info without the body. Get the body with Get Email Content. Uses no credits.',
    idempotent: true,
  },
  props: {
    keywords: aiProps.text({ displayName: 'Keywords', description: 'Words matched against email content.', required: false }),
    sequence_ids: aiProps.textList({ displayName: 'Sequence IDs', description: 'Only emails from these sequences (Search Sequences, field id).', required: false }),
    user_ids: aiProps.textList({ displayName: 'Sender User IDs', description: 'Only emails sent by these users (List Users, field id).', required: false }),
    statuses: aiProps.textList({ displayName: 'Statuses', description: 'Email statuses, e.g. delivered, scheduled, drafted, not_opened, opened, clicked, unsubscribed, demoed, bounced, spam_blocked, failed_other.', required: false }),
    date_mode: aiProps.choice({
      displayName: 'Date Field',
      description: 'Which date the range applies to.',
      required: false,
      options: [
        { label: 'Due at', value: 'due_at' },
        { label: 'Completed (sent) at', value: 'completed_at' },
      ],
    }),
    date_from: aiProps.text({ displayName: 'From Date', description: 'Start of the date range, YYYY-MM-DD. Needs Date Field.', required: false }),
    date_to: aiProps.text({ displayName: 'To Date', description: 'End of the date range, YYYY-MM-DD. Needs Date Field.', required: false }),
    page: aiProps.page(),
    per_page: aiProps.perPage({ max: 100, fallback: 25 }),
  },
  outputSchema: apolloOutputSchemas.outreachEmailSearch,
  async run({ propsValue, auth }) {
    const { page, perPage } = apolloInputs.pageParams({ page: propsValue.page, perPage: propsValue.per_page, maxPerPage: 100, defaultPerPage: 25 });
    const dateMode = apolloInputs.optionalText(propsValue.date_mode);
    const from = apolloInputs.ymdDate({ value: propsValue.date_from, label: 'From Date' });
    const to = apolloInputs.ymdDate({ value: propsValue.date_to, label: 'To Date' });
    if ((from !== undefined || to !== undefined) && dateMode === undefined) {
      throw new Error('Choose a Date Field when giving a date range.');
    }
    const body = await apolloRequests.searchOutreachEmails({
      apiKey: apiKeyOf(auth),
      query: {
        q_keywords: apolloInputs.optionalText(propsValue.keywords),
        'emailer_campaign_ids[]': apolloInputs.stringList(propsValue.sequence_ids),
        'user_ids[]': apolloInputs.stringList(propsValue.user_ids),
        'emailer_message_stats[]': apolloInputs.stringList(propsValue.statuses),
        emailer_message_date_range_mode: from === undefined && to === undefined ? undefined : dateMode,
        'emailer_message_date_range[min]': from,
        'emailer_message_date_range[max]': to,
        page,
        per_page: perPage,
      },
    });
    const emails = recordsOf(body['emailer_messages']).map((email) => apolloMappers.outreachEmail(email));
    return { ...apolloMappers.pageInfo({ body, page, perPage, returned: emails.length }), emails };
  },
});
