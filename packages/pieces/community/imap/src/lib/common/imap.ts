import {
  ImapFlow,
  type CopyResponseObject,
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
  ImapEmailNotFoundError,
} from './errors';

type Message = {
  data: ParsedMail & { uid: number };
  epochMilliSeconds: number;
};

function buildImapClient(auth: ImapAuth): ImapFlow {
  const imapConfig = {
    host: auth.props.host,
    port: auth.props.port,
    secure: auth.props.tls,
    auth: { user: auth.props.username, pass: auth.props.password },
    tls: { rejectUnauthorized: auth.props.validateCertificates },
  };

  return new ImapFlow({ ...imapConfig, logger: false });
}

async function confirmEmailExists(
  imapClient: ImapFlow,
  uid: number
): Promise<void> {
  const searchResult = await imapClient.search(
    { uid: uid.toString() },
    { uid: true }
  );

  if (!searchResult || searchResult.length === 0) {
    throw new ImapEmailNotFoundError();
  }
}

function detectMissingMailbox(error: unknown): void {
  if (
    error &&
    typeof error === 'object' &&
    'mailboxMissing' in error &&
    (error as { mailboxMissing: boolean }).mailboxMissing
  ) {
    throw new ImapMailboxNotFoundError();
  }
}

async function copyEmail<T extends { success: boolean; newUid?: number }>({
  auth,
  sourceMailbox,
  targetMailbox,
  uid,
}: {
  auth: ImapAuth;
  sourceMailbox: string;
  targetMailbox: string;
  uid: number;
}): Promise<T> {
  return (await performMailboxOperation(
    auth,
    sourceMailbox,
    async (imapClient) => {
      await confirmEmailExists(imapClient, uid);

      const result: false | CopyResponseObject = await imapClient.messageCopy(
        { uid: uid.toString() },
        targetMailbox,
        { uid: true }
      );

      if (!result) {
        throw new ImapError('Failed to copy email.');
      }

      const newUid = result.uidMap?.get(uid);
      return { success: true, newUid };
    }
  )) as T;
}

async function deleteEmail<T extends { success: boolean }>({
  auth,
  mailbox,
  uid,
}: {
  auth: ImapAuth;
  mailbox: string;
  uid: number;
}): Promise<T> {
  return (await performMailboxOperation(auth, mailbox, async (imapClient) => {
    await confirmEmailExists(imapClient, uid);
    await imapClient.messageDelete({ uid: uid.toString() }, { uid: true });

    return { success: true };
  })) as T;
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

async function fetchMailboxes<T extends ListResponse[]>(
  auth: ImapAuth
): Promise<T> {
  return (await performImapOperation(auth, async (imapClient) => {
    return await imapClient.list();
  })) as T;
}

async function moveEmail<T extends { success: boolean; newUid?: number }>({
  auth,
  sourceMailbox,
  targetMailbox,
  uid,
}: {
  auth: ImapAuth;
  sourceMailbox: string;
  targetMailbox: string;
  uid: number;
}): Promise<T> {
  return (await performMailboxOperation(
    auth,
    sourceMailbox,
    async (imapClient) => {
      await confirmEmailExists(imapClient, uid);

      const result: false | CopyResponseObject = await imapClient.messageMove(
        { uid: uid.toString() },
        targetMailbox,
        { uid: true }
      );

      if (result) {
        const newUid = result.uidMap?.get(uid);
        return { success: true, newUid };
      }

      return { success: false };
    }
  )) as T;
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
  callback: (imapClient: ImapFlow) => Promise<T>,
  options: { readOnly?: boolean } = {}
) {
  const { readOnly = true } = options;
  return (await performImapOperation(auth, async (imapClient) => {
    let lock: MailboxLockObject | null = null;

    try {
      lock = await imapClient.getMailboxLock(mailbox, { readOnly: readOnly });
      return await callback(imapClient);
    } catch (error) {
      detectMissingMailbox(error);
      throw error;
    } finally {
      try {
        lock?.release();
      } catch (e) {
        // Ignore lock release errors during cleanup
      }
    }
  })) as T;
}

async function setEmailReadStatus<T extends { success: true }>({
  auth,
  mailbox,
  uid,
  markAsRead,
}: {
  auth: ImapAuth;
  mailbox: string;
  uid: number;
  markAsRead: boolean;
}): Promise<T> {
  return (await performMailboxOperation(
    auth,
    mailbox,
    async (imapClient) => {
      await confirmEmailExists(imapClient, uid);

      if (markAsRead) {
        await imapClient.messageFlagsAdd({ uid: uid.toString() }, ['\\Seen'], { uid: true });
      } else {
        await imapClient.messageFlagsRemove({ uid: uid.toString() }, ['\\Seen'], { uid: true });
      }

      return { success: true };
    },
    { readOnly: false }
  )) as T;
}

export {
  // Types
  type Attachment,
  type Message,

  // Helper functions
  performImapOperation,
  performMailboxOperation,

  // Email actions
  copyEmail,
  deleteEmail,
  fetchEmails,
  moveEmail,
  setEmailReadStatus,

  // Mailbox actions
  fetchMailboxes,
};
