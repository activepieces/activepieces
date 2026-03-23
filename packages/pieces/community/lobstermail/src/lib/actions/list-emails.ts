import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { lobstermailCommon, inboxIdDropdown } from '../common';
import { lobstermailAuth } from '../..';

export const listEmails = createAction({
  auth: lobstermailAuth,
  name: 'list_emails',
  displayName: 'List Emails',
  description: 'List emails in a specific inbox.',
  props: {
    inbox_id: inboxIdDropdown,
    direction: Property.StaticDropdown({
      displayName: 'Direction',
      description: 'Filter by inbound (received) or outbound (sent) emails.',
      required: false,
      options: {
        options: [
          { label: 'Inbound (received)', value: 'inbound' },
          { label: 'Outbound (sent)', value: 'outbound' },
        ],
      },
    }),
    unread_only: Property.Checkbox({
      displayName: 'Unread Only',
      description: 'Return only unread emails.',
      required: false,
      defaultValue: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of emails to return (1–50, default 20).',
      required: false,
      defaultValue: 20,
    }),
  },
  async run(context) {
    const { inbox_id, direction, unread_only, limit } = context.propsValue;
    const params = new URLSearchParams();
    if (limit) params.set('limit', String(limit));
    if (direction) params.set('direction', direction);
    if (unread_only) params.set('unread', 'true');

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
        isInjectionRisk?: boolean;
        injectionRiskScore?: number;
      }[];
    }>({
      method: HttpMethod.GET,
      url: `${lobstermailCommon.baseUrl}/v1/inboxes/${inbox_id}/emails?${params.toString()}`,
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
      is_injection_risk: email.isInjectionRisk ?? null,
      injection_risk_score: email.injectionRiskScore ?? null,
    }));
  },
});
