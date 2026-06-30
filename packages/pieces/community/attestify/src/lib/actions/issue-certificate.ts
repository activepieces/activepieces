import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

interface AttestifyCert {
  cert_id: string;
  recipient_name: string;
  recipient_email?: string;
  course: string;
  issuer: string;
  verify_url: string;
  cert_url: string;
  json_url: string;
}

interface AttestifyIssueResponse {
  ok: boolean;
  error?: string;
  detail?: string;
  certs?: AttestifyCert[];
}

export const issueCertificate = createAction({
  name: 'issue_certificate',
  displayName: 'Issue Certificate',
  description:
    'Issue a verifiable certificate for one recipient. Returns a permanent, tamper-evident public verify page (Ed25519-signed) that anyone can check with no account.',
  props: {
    issuer: Property.ShortText({
      displayName: 'Organization / Issuer',
      description:
        'The organization issuing the certificate (shown on the certificate and the public verify page).',
      required: true,
    }),
    course: Property.ShortText({
      displayName: 'Course / Credential',
      description: 'The course or credential being certified.',
      required: true,
    }),
    recipientName: Property.ShortText({
      displayName: 'Recipient Name',
      description: 'Name of the certificate recipient. Map an upstream field from your trigger.',
      required: true,
    }),
    recipientEmail: Property.ShortText({
      displayName: 'Recipient Email',
      description:
        'Optional. Echoed back so you can join it to the verify URL for a mail-merge or LMS record. It is never stored in the signed record and never shown on the public verify page (recipient PII stays on your side).',
      required: false,
    }),
    completionDate: Property.ShortText({
      displayName: 'Completion Date',
      description:
        'Optional. The date the credential was earned, shown on the certificate (format YYYY-MM-DD). Leave empty to stamp today.',
      required: false,
    }),
    baseUrl: Property.ShortText({
      displayName: 'API Base URL',
      description: 'Base URL of the Attestify service. Change only for self-hosting or testing.',
      required: false,
      defaultValue: 'https://attestify.novadyne.ai',
    }),
  },
  async run(context) {
    const { issuer, course, recipientName, recipientEmail, completionDate } = context.propsValue;
    const baseUrl = (context.propsValue.baseUrl || 'https://attestify.novadyne.ai').replace(
      /\/+$/,
      ''
    );

    const name = (recipientName ?? '').trim();
    if (!name) {
      throw new Error('Recipient Name is required');
    }

    const issuerName = (issuer ?? '').trim();
    if (!issuerName) {
      throw new Error('Organization / Issuer is required');
    }

    const courseName = (course ?? '').trim();
    if (!courseName) {
      throw new Error('Course / Credential is required');
    }

    const date = (completionDate ?? '').trim();
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error(`Completion Date must be in YYYY-MM-DD format (got "${date}")`);
    }

    const email = (recipientEmail ?? '').trim();
    const recipient: { name: string; email?: string } = { name };
    if (email) {
      recipient.email = email;
    }

    const body: {
      issuer: string;
      course: string;
      recipients: Array<{ name: string; email?: string }>;
      date?: string;
    } = {
      issuer: issuerName,
      course: courseName,
      recipients: [recipient],
    };
    if (date) {
      body.date = date;
    }

    const response = await httpClient.sendRequest<AttestifyIssueResponse>({
      method: HttpMethod.POST,
      url: `${baseUrl}/cert/issue`,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'activepieces-piece-attestify/0.0.1',
      },
      body,
    });

    const data = response.body;
    if (!data || data.ok !== true) {
      const err = data?.error ?? 'unknown';
      const detail = data?.detail ? ` — ${data.detail}` : '';
      throw new Error(`Attestify error: ${err}${detail}`);
    }

    const cert = data.certs && data.certs[0];
    if (!cert) {
      throw new Error(
        'Attestify returned no certificate (the recipient may have been filtered as empty, or the request was treated as an automated crawler).'
      );
    }

    return {
      cert_id: cert.cert_id,
      recipient_name: cert.recipient_name,
      recipient_email: cert.recipient_email ?? (email || undefined),
      course: cert.course,
      issuer: cert.issuer,
      completion_date: date || undefined,
      verify_url: cert.verify_url,
      cert_image_url: cert.cert_url,
      signed_record_url: cert.json_url,
    };
  },
});
