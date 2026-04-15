import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { lobstermailCommon, inboxIdDropdown } from '../common';
import { lobstermailAuth } from '../..';

export const getEmail = createAction({
  auth: lobstermailAuth,
  name: 'get_email',
  displayName: 'Get Email',
  description: 'Get a single email with full body content.',
  props: {
    inbox_id: inboxIdDropdown,
    email_id: Property.ShortText({
      displayName: 'Email ID',
      description:
        'The ID of the email to retrieve (starts with eml_). You can get this from the "List Emails" action or the "New Email Received" trigger output.',
      required: true,
    }),
  },
  async run(context) {
    const { inbox_id, email_id } = context.propsValue;

    const response = await httpClient.sendRequest<{
      id: string;
      inboxId: string;
      from: string;
      to: string[];
      cc?: string[];
      subject: string;
      body?: { text?: string; html?: string };
      preview?: string;
      threadId?: string;
      direction: string;
      createdAt: string;
      isInjectionRisk?: boolean;
      injectionRiskScore?: number;
      spf?: string;
      dkim?: string;
      dmarc?: string;
    }>({
      method: HttpMethod.GET,
      url: `${lobstermailCommon.baseUrl}/v1/inboxes/${inbox_id}/emails/${email_id}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
    });

    const email = response.body;
    return {
      id: email.id,
      inbox_id: email.inboxId,
      from: email.from,
      to: Array.isArray(email.to) ? email.to.join(', ') : email.to,
      cc: Array.isArray(email.cc) ? email.cc.join(', ') : (email.cc ?? null),
      subject: email.subject,
      body_text: email.body?.text ?? null,
      body_html: email.body?.html ?? null,
      preview: email.preview ?? null,
      thread_id: email.threadId ?? null,
      direction: email.direction,
      created_at: email.createdAt,
      is_injection_risk: email.isInjectionRisk ?? null,
      injection_risk_score: email.injectionRiskScore ?? null,
      spf: email.spf ?? null,
      dkim: email.dkim ?? null,
      dmarc: email.dmarc ?? null,
    };
  },
});
