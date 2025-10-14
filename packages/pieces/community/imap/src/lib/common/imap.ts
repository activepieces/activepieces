import {
  ImapFlow,
  type ListResponse,
  type MailboxLockObject,
} from 'imapflow';
import { type Attachment, type ParsedMail, simpleParser } from 'mailparser';
import { Readable } from 'stream';
import dayjs from 'dayjs';

import { type ImapAuth } from './auth';
import { DEFAULT_LOOKBACK_HOURS } from './constants';
import {
  type ImapClientError,
  ImapConnectionRefusedError,
  ImapHostNotFoundError,
  ImapSslPacketLengthTooLongError,
  ImapConnectionTimeoutError,
  ImapAuthenticationError,
  ImapCertificateError,
  ImapError,
  ImapMailboxNotFoundError,
  ImapConnectionLostError,
} from './errors';

type Message = {
  data: ParsedMail & { uid: number };
  epochMilliSeconds: number;
}

function buildImapClient(auth: ImapAuth): ImapFlow {
  const imapConfig = {
    host: auth.host,
    port: auth.port,
    secure: auth.tls,
    auth: { user: auth.username, pass: auth.password },
    tls: { rejectUnauthorized: auth.validateCertificates },
  };

  return new ImapFlow({ ...imapConfig, logger: false });
}

function detectMissingMailbox(error: unknown): void {
  if (error && typeof error === 'object' && 'mailboxMissing' in error && (error as { mailboxMissing: boolean }).mailboxMissing) {
    throw new ImapMailboxNotFoundError();
  }
}

async function fetchEmails<T extends Message[]>({
  auth,
  lastPoll,
  mailbox,
}: {
  auth: ImapAuth;
  lastPoll: number;
  mailbox: string;
}): Promise<T> {
  return (await performMailboxOperation(auth, mailbox, async (imapClient) => {
    const messages = [];
    const since =
      lastPoll === 0
        ? dayjs().subtract(DEFAULT_LOOKBACK_HOURS, 'hour').toISOString()
        : dayjs(lastPoll).toISOString();
    const res = imapClient.fetch({ since }, { source: true });

    for await (const message of res) {
      const { source, uid } = message;
      const castedItem = await parseStream(source as unknown as Readable);
      messages.push({
        data: { ...castedItem, uid },
        epochMilliSeconds: dayjs(castedItem.date).valueOf(),
      });
    }

    return messages;
  })) as T;
}

async function fetchMailboxes<T extends ListResponse[]>(auth: ImapAuth): Promise<T> {
  return (await performImapOperation(auth, async (imapClient) => {
    return await imapClient.list();
  })) as T;
}

async function parseStream(stream: Readable) {
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

async function performImapOperation(
  auth: ImapAuth,
  callback: (imapClient: ImapFlow) => Promise<unknown>
) {
  let imapClient: ImapFlow | null = null;

  try {
    imapClient = buildImapClient(auth);
    await imapClient.connect();
    return await callback(imapClient);
  } catch (error) {
    const imapError = error as ImapClientError;

    if (imapError.code === 'ECONNREFUSED') {
      throw new ImapConnectionRefusedError();
    } else if (imapError.code === 'ENOTFOUND') {
      throw new ImapHostNotFoundError();
    } else if (imapError.code === 'ETIMEDOUT') {
      throw new ImapConnectionTimeoutError();
    } else if (imapError.code === 'ERR_SSL_PACKET_LENGTH_TOO_LONG') {
      throw new ImapSslPacketLengthTooLongError();
    } else if (imapError.responseText?.includes('AUTH')) {
      throw new ImapAuthenticationError();
    } else if (imapError.message?.includes('IMAP connection')) {
      throw new ImapConnectionLostError();
    } else if (imapError.message?.includes('certificate')) {
      throw new ImapCertificateError();
    } else if (imapError instanceof ImapError) {
      throw imapError;
    }

    throw new ImapError(
      imapError.message || 'Failed to perform IMAP operation'
    );
  } finally {
    try {
      if (imapClient?.usable) {
        await imapClient.logout();
      }
    } catch (e) {
      // Ignore logout errors during cleanup
    }
  }
}

async function performMailboxOperation<T>(
  auth: ImapAuth,
  mailbox: string,
  callback: (imapClient: ImapFlow) => Promise<T>
) {
  return await performImapOperation(auth, async (imapClient) => {
    let lock: MailboxLockObject | null = null;

    try {
      lock = await imapClient.getMailboxLock(mailbox, { readOnly: true });
      return await callback(imapClient);
    } catch(error) {
      detectMissingMailbox(error);
      throw error;
    } finally {
      try {
        lock?.release();
      } catch (e) {
        // Ignore lock release errors during cleanup
      }
    }
  }) as T;
}

export {
  // Types
  type Attachment,
  type Message,

  // Helper functions
  performImapOperation,
  performMailboxOperation,

  // Email actions
  fetchEmails,

  // Mailbox actions
  fetchMailboxes,
};
