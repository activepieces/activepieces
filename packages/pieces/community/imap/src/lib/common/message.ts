import { FilesService, Property } from '@activepieces/pieces-framework';
import {
  type CopyResponseObject,
  type FetchMessageObject,
  type ImapFlow,
  type MailboxObject,
  type MessageAddressObject,
} from 'imapflow';
import { type AddressObject, type Attachment } from 'mailparser';
import { ImapEmailNotFoundError, ImapError } from './errors';

const MAX_UIDS = 500;

function flagsToArray(flags: Set<string> | undefined): string[] {
  return flags ? [...flags].sort() : [];
}

function bigintToString(value: bigint | undefined): string | undefined {
  return value === undefined ? undefined : value.toString();
}

function toIsoDate(value: Date | string | undefined): string | null {
  if (value === undefined) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function mapEnvelopeAddresses(
  addresses: MessageAddressObject[] | undefined
): EmailAddress[] {
  return (addresses ?? []).map((entry) => ({
    name: entry.name ?? '',
    address: entry.address ?? '',
  }));
}

function mapParsedAddresses(
  value: AddressObject | AddressObject[] | undefined
): EmailAddress[] {
  if (!value) {
    return [];
  }
  const objects = Array.isArray(value) ? value : [value];
  const result: EmailAddress[] = [];
  for (const object of objects) {
    for (const entry of object.value) {
      if (entry.group && entry.group.length > 0) {
        for (const member of entry.group) {
          result.push({ name: member.name ?? '', address: member.address ?? '' });
        }
      } else {
        result.push({ name: entry.name ?? '', address: entry.address ?? '' });
      }
    }
  }
  return result;
}

function summarizeMessage({
  message,
}: {
  message: FetchMessageObject;
}): EmailSummary {
  const envelope = message.envelope;
  const from = mapEnvelopeAddresses(envelope?.from);
  const flags = flagsToArray(message.flags);
  return {
    uid: message.uid,
    message_id: envelope?.messageId ?? null,
    in_reply_to: envelope?.inReplyTo ?? null,
    subject: envelope?.subject ?? '',
    date: toIsoDate(envelope?.date),
    internal_date: toIsoDate(message.internalDate),
    from_name: from[0]?.name ?? '',
    from_address: from[0]?.address ?? '',
    to: mapEnvelopeAddresses(envelope?.to),
    cc: mapEnvelopeAddresses(envelope?.cc),
    flags,
    seen: flags.includes('\\Seen'),
    flagged: flags.includes('\\Flagged'),
    answered: flags.includes('\\Answered'),
    size: message.size ?? null,
  };
}

function parseUids({ uids }: { uids: unknown[] | undefined }): number[] {
  if (!uids || uids.length === 0) {
    throw new ImapError('Provide at least one message UID.');
  }
  const parsed = new Set<number>();
  for (const raw of uids) {
    const text = String(raw).trim();
    if (!/^[1-9]\d*$/.test(text)) {
      throw new ImapError(
        `"${text}" is not a valid message UID; UIDs are positive integers from search_emails.`
      );
    }
    parsed.add(Number(text));
  }
  if (parsed.size > MAX_UIDS) {
    throw new ImapError(`At most ${MAX_UIDS} UIDs can be processed per call.`);
  }
  return [...parsed].sort((a, b) => a - b);
}

function parseSingleUid({ uid }: { uid: unknown }): number {
  const [value] = parseUids({ uids: [uid] });
  return value;
}

function selectedMailbox({ client }: { client: ImapFlow }): MailboxObject {
  const mailbox = client.mailbox;
  if (!mailbox) {
    throw new ImapError('No folder is open on the IMAP connection.');
  }
  return mailbox;
}

function assertUidValidity({
  client,
  expected,
}: {
  client: ImapFlow;
  expected: string;
}): void {
  const trimmed = expected.trim();
  if (!trimmed) {
    throw new ImapError(
      'uid_validity is required so stale UIDs cannot target the wrong emails. Re-run search_emails on this folder and pass the uid_validity it returns.'
    );
  }
  const actual = selectedMailbox({ client }).uidValidity.toString();
  if (actual !== trimmed) {
    throw new ImapError(
      `The folder UIDVALIDITY changed from ${trimmed} to ${actual}, so the supplied UIDs are stale and may now identify different emails. Nothing was changed. Re-run search_emails on this folder to get fresh UIDs and uid_validity, then retry.`
    );
  }
}

function assertOptionalUidValidity({
  client,
  expected,
}: {
  client: ImapFlow;
  expected: string | undefined;
}): void {
  if (!expected?.trim()) {
    return;
  }
  assertUidValidity({ client, expected });
}

async function partitionExistingUids({
  client,
  uids,
}: {
  client: ImapFlow;
  uids: number[];
}): Promise<{ found: number[]; notFound: number[] }> {
  const result = await client.search({ uid: uids.join(',') }, { uid: true });
  if (result === false) {
    throw new ImapError('The server rejected the UID search.');
  }
  const existing = new Set(result);
  const found = uids.filter((uid) => existing.has(uid));
  const notFound = uids.filter((uid) => !existing.has(uid));
  if (found.length === 0) {
    throw new ImapEmailNotFoundError();
  }
  return { found, notFound };
}

async function assertFolderExists({
  client,
  path,
}: {
  client: ImapFlow;
  path: string;
}): Promise<void> {
  try {
    const status = await client.status(path, { messages: true });
    if (!status) {
      throw new ImapError(`Could not read the target folder "${path}".`);
    }
  } catch (error) {
    if (error instanceof ImapError) {
      throw error;
    }
    if (hasCode({ error, code: 'NotFound' })) {
      throw new ImapError(
        `Target folder "${path}" does not exist; create it with create_folder or pick a path from list_folders.`
      );
    }
    throw error;
  }
}

function assertUidPlusForDelete({ client }: { client: ImapFlow }): void {
  if (!client.capabilities.has('UIDPLUS')) {
    throw new ImapError(
      'The server does not support UIDPLUS, so deleting would expunge every message marked \\Deleted in the folder. Use trash_emails instead.'
    );
  }
}

async function transferMessages({
  client,
  uids,
  target,
  mode,
}: {
  client: ImapFlow;
  uids: number[];
  target: string;
  mode: 'move' | 'copy';
}): Promise<CopyResponseObject> {
  const range = uids.join(',');
  if (mode === 'copy') {
    const copied = await client.messageCopy(range, target, { uid: true });
    if (!copied) {
      throw new ImapError(`The server refused to copy the emails to "${target}".`);
    }
    return copied;
  }
  if (client.capabilities.has('MOVE')) {
    const moved = await client.messageMove(range, target, { uid: true });
    if (!moved) {
      throw new ImapError(`The server refused to move the emails to "${target}".`);
    }
    return moved;
  }
  if (client.capabilities.has('UIDPLUS')) {
    const copied = await client.messageCopy(range, target, { uid: true });
    if (!copied) {
      throw new ImapError(`The server refused to copy the emails to "${target}"; nothing was removed.`);
    }
    const deleted = await client.messageDelete(range, { uid: true });
    if (!deleted) {
      throw new ImapError(
        `The emails were copied to "${target}" but could not be removed from the source folder.`
      );
    }
    return copied;
  }
  throw new ImapError(
    'The server supports neither MOVE nor UIDPLUS, so a safe move is not possible. Use copy_emails instead.'
  );
}

async function transferInFolder({
  client,
  sourceFolder,
  targetFolder,
  uids,
  uidValidity,
  mode,
}: {
  client: ImapFlow;
  sourceFolder: string;
  targetFolder: string;
  uids: number[];
  uidValidity: string;
  mode: 'move' | 'copy';
}): Promise<TransferOutput> {
  if (samePath({ a: sourceFolder, b: targetFolder })) {
    throw new ImapError('The source and target folders must be different.');
  }
  await assertFolderExists({ client, path: targetFolder });
  return withMailboxLock({
    client,
    folder: sourceFolder,
    readOnly: false,
    run: async () => {
      assertUidValidity({ client, expected: uidValidity });
      const mailbox = selectedMailbox({ client });
      const { found, notFound } = await partitionExistingUids({ client, uids });
      const response = await transferMessages({ client, uids: found, target: targetFolder, mode });
      const results = found.map((uid) => {
        const newUid = response.uidMap?.get(uid);
        return newUid === undefined ? { uid } : { uid, new_uid: newUid };
      });
      const targetUidValidity = bigintToString(response.uidValidity);
      return {
        source_folder: mailbox.path,
        source_uid_validity: mailbox.uidValidity.toString(),
        ...(targetUidValidity ? { target_uid_validity: targetUidValidity } : {}),
        results,
        count: results.length,
        not_found_uids: notFound,
      };
    },
  });
}

async function withMailboxLock<T>({
  client,
  folder,
  readOnly,
  run,
}: {
  client: ImapFlow;
  folder: string;
  readOnly: boolean;
  run: () => Promise<T>;
}): Promise<T> {
  const lock = await client.getMailboxLock(folder, { readOnly });
  try {
    return await run();
  } finally {
    lock.release();
  }
}

async function writeAttachments({
  attachments,
  files,
}: {
  attachments: Attachment[];
  files: FilesService;
}): Promise<AttachmentOutput[]> {
  return Promise.all(
    attachments.map(async (attachment, index) => {
      const filename = attachment.filename ?? `attachment-${index + 1}`;
      const file = await files.write({ fileName: filename, data: attachment.content });
      return {
        filename,
        content_type: attachment.contentType,
        size: attachment.size,
        file,
      };
    })
  );
}

function isInbox({ path }: { path: string }): boolean {
  return path.trim().toUpperCase() === 'INBOX';
}

function samePath({ a, b }: { a: string; b: string }): boolean {
  return isInbox({ path: a }) && isInbox({ path: b }) ? true : a === b;
}

function hasCode({ error, code }: { error: unknown; code: string }): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === code
  );
}

const folderProp = ({
  displayName,
  description,
}: {
  displayName: string;
  description: string;
}) =>
  Property.ShortText({
    displayName,
    description,
    required: true,
    defaultValue: 'INBOX',
  });

const uidsProp = () =>
  Property.Array({
    displayName: 'Message UIDs',
    description:
      'UIDs from search_emails in the same folder (up to 500). UIDs that no longer exist are reported in not_found_uids.',
    required: true,
  });

const uidValidityProp = <T extends boolean>({ required }: { required: T }) =>
  Property.ShortText({
    displayName: 'UID Validity',
    description: required
      ? 'The uid_validity returned by the search_emails call that produced these UIDs. If the folder UIDVALIDITY has changed the UIDs are stale and the call fails instead of acting on unrelated emails.'
      : 'The uid_validity returned by search_emails. When set and the folder has changed, the call fails instead of reading a stale UID.',
    required,
  });

type EmailAddress = { name: string; address: string };

type EmailSummary = {
  uid: number;
  message_id: string | null;
  in_reply_to: string | null;
  subject: string;
  date: string | null;
  internal_date: string | null;
  from_name: string;
  from_address: string;
  to: EmailAddress[];
  cc: EmailAddress[];
  flags: string[];
  seen: boolean;
  flagged: boolean;
  answered: boolean;
  size: number | null;
};

type TransferOutput = {
  source_folder: string;
  source_uid_validity: string;
  target_uid_validity?: string;
  results: Array<{ uid: number; new_uid?: number }>;
  count: number;
  not_found_uids: number[];
};

type AttachmentOutput = {
  filename: string;
  content_type: string;
  size: number;
  file: string;
};

export {
  type EmailAddress,
  type EmailSummary,
  type AttachmentOutput,
  type TransferOutput,
  MAX_UIDS,
  transferInFolder,
  flagsToArray,
  bigintToString,
  toIsoDate,
  mapEnvelopeAddresses,
  mapParsedAddresses,
  summarizeMessage,
  parseUids,
  parseSingleUid,
  selectedMailbox,
  assertUidValidity,
  assertOptionalUidValidity,
  partitionExistingUids,
  assertFolderExists,
  assertUidPlusForDelete,
  transferMessages,
  withMailboxLock,
  writeAttachments,
  isInbox,
  samePath,
  hasCode,
  folderProp,
  uidsProp,
  uidValidityProp,
};
