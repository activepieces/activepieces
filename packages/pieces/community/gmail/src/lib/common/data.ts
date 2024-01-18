import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import {
  GmailLabel,
  GmailMessage,
  GmailThread,
  GmailMessageFormat,
  GmailMessageResponse as GmailMessageList,
} from './models';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';

interface SearchMailProps {
  access_token: string;
  from: string;
  to: string;
  subject: string;
  label: GmailLabel;
  category: string;
  after?: number;
  before?: number;
  max_results?: number;
  page_token?: string;
}

interface GetMailProps {
  access_token: string;
  message_id?: string;
  thread_id?: string;
  format: GmailMessageFormat;
}

export const GmailRequests = {
  getMail: async ({ access_token, format, message_id }: GetMailProps) => {
    const response = await httpClient.sendRequest<GmailMessage>({
      method: HttpMethod.GET,
      url: `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message_id}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: access_token,
      },
      queryParams: {
        format,
      },
    });
    let bodyHtml = '';
    let bodyPlain = '';
    const payload = response.body.payload;
    let bodyParts = payload.parts || [];
    const headers = payload.headers.reduce(
      (obj: { [key: string]: string }, header) => {
        obj[header.name.toLowerCase()] = header.value;
        return obj;
      },
      {}
    );
    const alternateBodyPart = bodyParts.find((part) =>
      part.mimeType.startsWith('multipart/alternative')
    );
    if (alternateBodyPart && alternateBodyPart?.parts) {
      bodyParts = alternateBodyPart.parts;
    }
    const subject = headers['subject'] || '';
    // Determine the content type of the message body
    const contentType = headers['content-type'] || 'text/plain';
    const isMultipart = contentType.startsWith('multipart/');

    if (isMultipart) {
      // If the message is multipart, extract the plain text and HTML parts
      const textPart = bodyParts.find((part) => part.mimeType === 'text/plain');
      const htmlPart = bodyParts.find((part) => part.mimeType === 'text/html');

      // If the message is an "alternative" multipart, use the plain text part if it exists
      const preferredPart = textPart || htmlPart;
      bodyHtml = htmlPart ? decodeBase64(htmlPart.body.data) : '';
      bodyPlain = preferredPart ? decodeBase64(preferredPart.body.data) : '';
    } else {
      // If the message is not multipart, use the body as-is
      bodyPlain = decodeBase64(payload.body.data);
      bodyHtml = '';
    }

    return {
      subject: subject,
      body_html: bodyHtml,
      body_plain: bodyPlain,
      ...response.body,
    };
  },
  getThread: async ({ access_token, format, thread_id }: GetMailProps) => {
    const response = await httpClient.sendRequest<GmailThread>({
      method: HttpMethod.GET,
      url: `https://gmail.googleapis.com/gmail/v1/users/me/threads/${thread_id}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: access_token,
      },
      queryParams: {
        format,
      },
    });

    return response.body;
  },
  getLabels: async (authentication: OAuth2PropertyValue) => {
    return await httpClient.sendRequest<{ labels: GmailLabel[] }>({
      method: HttpMethod.GET,
      url: `https://gmail.googleapis.com/gmail/v1/users/me/labels`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: (authentication as OAuth2PropertyValue).access_token,
      },
    });
  },
  searchMail: async ({
    access_token,
    max_results = 1,
    page_token: pageToken,
    ...mail
  }: SearchMailProps) => {
    const query = [];

    if (mail.from) query.push(`from:(${mail.from})`);
    if (mail.to) query.push(`to:(${mail.to})`);
    if (mail.subject) query.push(`subject:(${mail.subject})`);
    if (mail.label) query.push(`label:${mail.label.name}`);
    if (mail.category) query.push(`category:${mail.category}`);
    if (mail.after != null && mail.after > 0) query.push(`after:${mail.after}`);
    if (mail.before != null) query.push(`before:${mail.before}`);

    const response = await httpClient.sendRequest<GmailMessageList>({
      method: HttpMethod.GET,
      url: `https://www.googleapis.com/gmail/v1/users/me/messages`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: access_token,
      },
      queryParams: {
        q: query.join(' '),
        maxResults: `${max_results}`,
        ...(pageToken ? { pageToken } : {}),
      },
    });

    if (response.body.messages) {
      const messages = await Promise.all(
        response.body.messages.map(
          async (message: { id: string; threadId: string }) => {
            const mail = await GmailRequests.getMail({
              access_token,
              message_id: message.id,
              format: GmailMessageFormat.FULL,
            });
            const thread = await GmailRequests.getThread({
              access_token,
              thread_id: message.threadId,
              format: GmailMessageFormat.FULL,
            });

            return {
              message: mail,
              thread,
            };
          }
        )
      );

      return {
        messages,
        resultSizeEstimate: response.body.resultSizeEstimate,
        ...(response?.body.nextPageToken
          ? { nextPageToken: response.body.nextPageToken }
          : {}),
      };
    }

    return response.body;
  },
};

function decodeBase64(data: any) {
  return Buffer.from(data, 'base64').toString();
}
