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
import { Attachment, ParsedMail, simpleParser } from 'mailparser';
import { FilesService } from '@activepieces/pieces-framework';

interface SearchMailProps {
  access_token: string;
  from: string;
  to: string;
  subject?: string;
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
  modifyEmailLabels: async function(params: {
    access_token: string;
    message_id: string;
    add_label_ids?: string[];
    remove_label_ids?: string[];
  }) {
    const { access_token, message_id, add_label_ids, remove_label_ids } = params;
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message_id}/modify`,
      body: {
        addLabelIds: add_label_ids || [],
        removeLabelIds: remove_label_ids || []
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: access_token
      }
    });
    
    return response.body;
  },
  
  getMail: async function(params: GetMailProps) {
    const { access_token, format, message_id } = params;
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
      function(obj: { [key: string]: string }, header) {
        obj[header.name.toLowerCase()] = header.value;
        return obj;
      },
      {}
    );
    const alternateBodyPart = bodyParts.find(function(part) {
      return part.mimeType.startsWith('multipart/alternative');
    });
    if (alternateBodyPart && alternateBodyPart?.parts) {
      bodyParts = alternateBodyPart.parts;
    }
    const subject = headers['subject'] || '';
    // Determine the content type of the message body
    const contentType = headers['content-type'] || 'text/plain';
    const isMultipart = contentType.startsWith('multipart/');

    if (isMultipart) {
      // If the message is multipart, extract the plain text and HTML parts
      const textPart = bodyParts.find(function(part) { return part.mimeType === 'text/plain'; });
      const htmlPart = bodyParts.find(function(part) { return part.mimeType === 'text/html'; });

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
  getThread: async function(params: GetMailProps) {
    const { access_token, format, thread_id } = params;
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
  getLabels: async function(authentication: OAuth2PropertyValue) {
    return await httpClient.sendRequest<{ labels: GmailLabel[] }>({
      method: HttpMethod.GET,
      url: `https://gmail.googleapis.com/gmail/v1/users/me/labels`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: (authentication as OAuth2PropertyValue).access_token,
      },
    });
  },
  searchMail: async function(params: SearchMailProps) {
    const { access_token, max_results = 1, page_token: pageToken, ...mail } = params;
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
          async function(message: { id: string; threadId: string }) {
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

// Import Node.js Buffer type
/// <reference types="node" />

export async function parseStream(stream: any) {
  return new Promise<ParsedMail>(function(resolve, reject) {
    simpleParser(stream, function(err: Error | null, parsed: ParsedMail) {
      if (err) {
        reject(err);
      } else {
        resolve(parsed);
      }
    });
  });
}

export async function convertAttachment(
  attachments: Attachment[],
  files: FilesService
) {
  const promises = attachments.map(async function(attachment) {
    try {
      const fileName = attachment.filename ?? `attachment-${Date.now()}`;
      return {
        fileName,
        mimeType: attachment.contentType,
        size: attachment.size,
        data: await files.write({
          fileName: fileName,
          data: attachment.content,
        }),
      };
    } catch (error) {
      console.error(
        `Failed to process attachment: ${attachment.filename}`,
        error
      );
      return null;
    }
  });
  const results = await Promise.all(promises);
  return results.filter(function(result) { return result !== null; });
}
