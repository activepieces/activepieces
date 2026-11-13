import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { loopsAuth } from '../auth';
import { loopsClient } from '../common/client';
import { loopsSchemas } from '../common/schemas';

export const listTransactionalEmails = createAction({
  name: 'list_transactional_emails',
  classification: 'SEARCH',
  displayName: 'List Transactional Emails',
  description: 'Lists the transactional emails in your Loops account, one page at a time.',
  audience: 'both',
  outputSchema: loopsSchemas.transactionalEmails,
  aiMetadata: {
    description:
      'Lists one page of Loops transactional emails, newest first, with ID, name, data variables, published message ID and timestamps. Use the ID as transactionalId and the dataVariables names in send_transactional_email; only emails with a publishedEmailMessageId can be sent. Pass the returned nextCursor as cursor to get the next page; nextCursor is null on the last page. Read-only.',
    idempotent: true,
  },
  auth: loopsAuth,
  props: {
    perPage: Property.Number({
      displayName: 'Page Size',
      description: 'Number of emails per page, from 10 to 50. Defaults to 20.',
      required: false,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: 'The nextCursor value from a previous call. Leave empty for the first page.',
      required: false,
    }),
  },
  async run(context) {
    const { perPage, cursor } = context.propsValue;
    const queryParams: Record<string, string> = {
      perPage: String(Math.min(50, Math.max(10, Math.trunc(perPage ?? 20)))),
    };
    const trimmedCursor = (cursor ?? '').trim();
    if (trimmedCursor) queryParams['cursor'] = trimmedCursor;
    const body = await loopsClient.request<unknown>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/transactional-emails',
      queryParams,
    });
    if (!loopsClient.isRecord(body) || !Array.isArray(body['data'])) {
      throw new Error(`Loops returned an unexpected response for transactional emails: ${JSON.stringify(body)}`);
    }
    const pagination = body['pagination'];
    const next = loopsClient.isRecord(pagination) ? pagination['nextCursor'] : null;
    const emails = body['data'];
    return {
      emails,
      count: emails.length,
      nextCursor: typeof next === 'string' && next.length > 0 ? next : null,
    };
  },
});
