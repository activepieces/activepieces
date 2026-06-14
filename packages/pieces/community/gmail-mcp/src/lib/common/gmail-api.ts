import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';

export async function gmailRequest(
  accessToken: string,
  method: HttpMethod,
  path: string,
  body?: unknown
) {
  const response = await httpClient.sendRequest({
    method,
    url: `${GMAIL_API_BASE}${path}`,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body,
  });
  return response.body;
}

export function encodeEmail(options: {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
  isHtml?: boolean;
}): string {
  const contentType = options.isHtml ? 'text/html' : 'text/plain';
  const lines = [
    `To: ${options.to}`,
    options.cc ? `Cc: ${options.cc}` : '',
    options.bcc ? `Bcc: ${options.bcc}` : '',
    `Subject: ${options.subject}`,
    `Content-Type: ${contentType}; charset=utf-8`,
    '',
    options.body,
  ].filter(Boolean);
  return Buffer.from(lines.join('\r\n')).toString('base64url');
}
