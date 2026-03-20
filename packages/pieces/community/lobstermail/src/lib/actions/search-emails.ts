import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { lobstermailCommon, inboxIdDropdownOptional } from '../common';
import { lobstermailAuth } from '../..';

export const searchEmails = createAction({
  auth: lobstermailAuth,
  name: 'search_emails',
  displayName: 'Search Emails',
  description: 'Search emails across inboxes using full-text search and optional filters. Rate limited to 30 requests/minute.',
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Text to search for. Searches email subjects (highest priority), senders, and body previews.',
      required: true,
    }),
    inbox_id: inboxIdDropdownOptional,
    direction: Property.StaticDropdown({
      displayName: 'Direction',
      description: 'Filter by inbound (received) or outbound (sent) emails.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Inbound (received)', value: 'inbound' },
          { label: 'Outbound (sent)', value: 'outbound' },
        ],
      },
    }),
    from: Property.ShortText({
      displayName: 'Sender Filter',
      description: 'Filter results to emails from a specific sender address (partial match supported).',
      required: false,
    }),
    has_attachments: Property.Checkbox({
      displayName: 'Has Attachments',
      description: 'Return only emails that have attachments.',
      required: false,
      defaultValue: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of results to return (1–50, default 20).',
      required: false,
      defaultValue: 20,
    }),
  },
  async run(context) {
    const { query, inbox_id, direction, from, has_attachments, limit } = context.propsValue;
    const params = new URLSearchParams();
    params.set('q', query);
    if (inbox_id) params.set('inboxId', inbox_id);
    if (direction) params.set('direction', direction);
    if (from) params.set('from', from);
    if (has_attachments) params.set('hasAttachments', 'true');
    if (limit) params.set('limit', String(limit));

    const response = await httpClient.sendRequest<{
      data: {
        id: string;
        inboxId: string;
        from: string;
        to: string[];
        subject: string;
        preview?: string;
        threadId?: string;
        direction: string;
        createdAt: string;
      }[];
    }>({
      method: HttpMethod.GET,
      url: `${lobstermailCommon.baseUrl}/v1/emails/search?${params.toString()}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
    });

    return (response.body.data ?? []).map((email) => ({
      id: email.id,
      inbox_id: email.inboxId,
      from: email.from,
      to: Array.isArray(email.to) ? email.to.join(', ') : email.to,
      subject: email.subject,
      preview: email.preview ?? null,
      thread_id: email.threadId ?? null,
      direction: email.direction,
      created_at: email.createdAt,
    }));
  },
});
