import { AppConnectionValueForAuthProperty, PieceAuth, Property, FilesService } from '@activepieces/pieces-framework';
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
import { AppConnectionType } from '@activepieces/shared';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const gmailScopes = [
  'https://www.googleapis.com/auth/gmail.send',
  'email',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.compose',
];

export const gmailAuth = [PieceAuth.OAuth2({
  description: '',
  authUrl: 'https://accounts.google.com/o/oauth2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  required: true,
  scope: gmailScopes,
}), PieceAuth.CustomAuth({
  displayName: 'Service Account (Advanced)',
  description: 'Authenticate via service account from https://console.cloud.google.com/ > IAM & Admin > Service Accounts > Create Service Account > Keys > Add key.  <br> <br> You can optionally use domain-wide delegation (https://support.google.com/a/answer/162106?hl=en#zippy=%2Cset-up-domain-wide-delegation-for-a-client) to access Gmail without adding the service account to each mailbox. <br> <br> **Note:** A user email with domain-wide delegation is required for Gmail service account access.',
  required: true,
  props: {
    serviceAccount: Property.ShortText({
      displayName: 'Service Account JSON Key',
      required: true,
    }),
    userEmail: Property.ShortText({
      displayName: 'User Email',
      required: false,
      description: 'Email address of the user to impersonate for domain-wide delegation.',
    }),
  },
  validate: async ({ auth }) => {
    try {
      await getAccessToken({
        type: AppConnectionType.CUSTOM_AUTH,
        props: { ...auth },
      });
    } catch (e) {
      return {
        valid: false,
        error: (e as Error).message,
      };
    }
    return {
      valid: true,
    };
  },
})];

export type GmailAuthValue = AppConnectionValueForAuthProperty<typeof gmailAuth>;

export async function createGoogleClient(auth: GmailAuthValue): Promise<OAuth2Client> {
  if (auth.type === AppConnectionType.CUSTOM_AUTH) {
    const serviceAccount = JSON.parse(auth.props.serviceAccount);
    return new google.auth.JWT({
      email: serviceAccount.client_email,
      key: serviceAccount.private_key,
      scopes: gmailScopes,
      subject: auth.props.userEmail,
    });
  }
  const authClient = new OAuth2Client();
  authClient.setCredentials(auth);
  return authClient;
}

export const getAccessToken = async (auth: GmailAuthValue): Promise<string> => {
  if (auth.type === AppConnectionType.CUSTOM_AUTH) {
    const googleClient = await createGoogleClient(auth);
    const response = await googleClient.getAccessToken();
    if (response.token) {
      return response.token;
    } else {
      throw new Error('Could not retrieve access token from service account json');
    }
  }
  return auth.access_token;
};

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
  getLabels: async (authentication: GmailAuthValue) => {
    return await httpClient.sendRequest<{ labels: GmailLabel[] }>({
      method: HttpMethod.GET,
      url: `https://gmail.googleapis.com/gmail/v1/users/me/labels`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: await getAccessToken(authentication),
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
  getRecentMessages: async (
    authentication: GmailAuthValue,
    maxResults = 20
  ) => {
    return await httpClient.sendRequest<GmailMessageList>({
      method: HttpMethod.GET,
      url: 'https://gmail.googleapis.com/gmail/v1/users/me/messages',
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: await getAccessToken(authentication),
      },
      queryParams: {
        maxResults: maxResults.toString(),
        q: 'in:inbox OR in:sent', // Get recent messages from inbox and sent
      },
    });
  },
  getRecentThreads: async (
    authentication: GmailAuthValue,
    maxResults = 15
  ) => {
    return await httpClient.sendRequest<{
      threads: { id: string; snippet?: string }[];
    }>({
      method: HttpMethod.GET,
      url: 'https://gmail.googleapis.com/gmail/v1/users/me/threads',
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: await getAccessToken(authentication),
      },
      queryParams: {
        maxResults: maxResults.toString(),
        q: 'in:inbox OR in:sent', // Get recent threads from inbox and sent
      },
    });
  },
};

function decodeBase64(data: any) {
  return Buffer.from(data, 'base64').toString();
}

export async function parseStream(stream: any) {
  return new Promise<ParsedMail>((resolve, reject) => {
    simpleParser(stream, (err, parsed) => {
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
  const promises = attachments.map(async (attachment) => {
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
  return results.filter((result) => result !== null);
}

export function getFirstFiveOrAll(array: unknown[]) {
  if (array.length <= 5) {
    return array;
  } else {
    return array.slice(0, 5);
  }
}
