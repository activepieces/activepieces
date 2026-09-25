import { randomBytes } from 'crypto';
import { ImapError } from './errors';

const CRLF = '\r\n';
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const ADDR_SPEC = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?$/;
const MESSAGE_ID = /^<[\x21-\x3b\x3d\x3f-\x7e]+@[\x21-\x3b\x3d\x3f-\x7e]+>$/;
const ASCII_PRINTABLE = /^[\x20-\x7e]*$/;
const NEEDS_QUOTING = /[()<>[\]:;@\\,."]/;
const MAX_ENCODED_BYTES = 45;

function assertHeaderSafe({ field, value }: { field: string; value: string }): void {
  if (/[\r\n\0]/.test(value)) {
    throw new ImapError(`${field} must not contain line breaks or NUL characters.`);
  }
}

function encodeWords({ value }: { value: string }): string[] {
  const words: string[] = [];
  let chunk = '';
  for (const char of value) {
    if (Buffer.byteLength(chunk + char, 'utf8') > MAX_ENCODED_BYTES) {
      words.push(chunk);
      chunk = '';
    }
    chunk += char;
  }
  if (chunk.length > 0) {
    words.push(chunk);
  }
  return words.map((word) => `=?UTF-8?B?${Buffer.from(word, 'utf8').toString('base64')}?=`);
}

function encodeText({ value }: { value: string }): string {
  if (ASCII_PRINTABLE.test(value) && value.length <= 900) {
    return value;
  }
  return encodeWords({ value }).join(`${CRLF} `);
}

function formatDisplayName({ name }: { name: string }): string {
  if (!ASCII_PRINTABLE.test(name)) {
    return encodeWords({ value: name }).join(`${CRLF} `);
  }
  if (NEEDS_QUOTING.test(name)) {
    return `"${name.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }
  return name;
}

function parseAddress({ field, value }: { field: string; value: string }): ParsedAddress {
  assertHeaderSafe({ field, value });
  const trimmed = value.trim();
  const angle = /^(.*)<([^<>]+)>$/.exec(trimmed);
  const rawName = angle ? angle[1].trim().replace(/^"(.*)"$/, '$1') : '';
  const address = angle ? angle[2].trim() : trimmed;
  if (!ADDR_SPEC.test(address)) {
    throw new ImapError(
      `${field} "${trimmed}" is not a valid email address; use "name@example.com" or "Name <name@example.com>" with an ASCII address.`
    );
  }
  return { name: rawName, address };
}

function formatAddress({ address }: { address: ParsedAddress }): string {
  if (!address.name) {
    return address.address;
  }
  return `${formatDisplayName({ name: address.name })} <${address.address}>`;
}

function formatAddressList({
  field,
  values,
}: {
  field: string;
  values: string[];
}): string | null {
  const cleaned = values.map((value) => value.trim()).filter((value) => value.length > 0);
  if (cleaned.length === 0) {
    return null;
  }
  return cleaned
    .map((value) => formatAddress({ address: parseAddress({ field, value }) }))
    .join(`,${CRLF} `);
}

function formatDate({ date }: { date: Date }): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMinutes);
  return `${DAYS[date.getDay()]}, ${pad(date.getDate())} ${MONTHS[date.getMonth()]} ${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())} ${sign}${pad(Math.floor(abs / 60))}${pad(abs % 60)}`;
}

function base64Body({ content }: { content: string }): string {
  const encoded = Buffer.from(content, 'utf8').toString('base64');
  const lines = encoded.match(/.{1,76}/g) ?? [];
  return lines.join(CRLF);
}

function textPart({ subtype, content }: { subtype: 'plain' | 'html'; content: string }): string {
  return [
    `Content-Type: text/${subtype}; charset=UTF-8`,
    'Content-Transfer-Encoding: base64',
    '',
    base64Body({ content }),
  ].join(CRLF);
}

function buildDraftMessage({
  from,
  to,
  cc,
  bcc,
  subject,
  text,
  html,
  inReplyTo,
  date,
}: {
  from: string;
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  text: string | undefined;
  html: string | undefined;
  inReplyTo: string | undefined;
  date: Date;
}): { raw: string; messageId: string } {
  const fromAddress = parseAddress({ field: 'From', value: from });
  const toHeader = formatAddressList({ field: 'To', values: to });
  if (!toHeader) {
    throw new ImapError('Provide at least one recipient in To.');
  }
  const ccHeader = formatAddressList({ field: 'Cc', values: cc });
  const bccHeader = formatAddressList({ field: 'Bcc', values: bcc });
  assertHeaderSafe({ field: 'Subject', value: subject });
  const replyTo = inReplyTo?.trim();
  if (replyTo) {
    assertHeaderSafe({ field: 'In-Reply-To', value: replyTo });
    if (!MESSAGE_ID.test(replyTo)) {
      throw new ImapError('In-Reply-To must be a Message-ID in the form <id@domain>.');
    }
  }
  if (!text && !html) {
    throw new ImapError('Provide a text body, an HTML body, or both.');
  }
  const domain = fromAddress.address.split('@')[1];
  const messageId = `<${randomBytes(12).toString('hex')}.${date.getTime()}@${domain}>`;
  const headers = [
    `From: ${formatAddress({ address: fromAddress })}`,
    `To: ${toHeader}`,
  ];
  if (ccHeader) {
    headers.push(`Cc: ${ccHeader}`);
  }
  if (bccHeader) {
    headers.push(`Bcc: ${bccHeader}`);
  }
  headers.push(`Subject: ${encodeText({ value: subject })}`);
  headers.push(`Date: ${formatDate({ date })}`);
  headers.push(`Message-ID: ${messageId}`);
  if (replyTo) {
    headers.push(`In-Reply-To: ${replyTo}`);
    headers.push(`References: ${replyTo}`);
  }
  headers.push('MIME-Version: 1.0');

  let body: string;
  if (text && html) {
    const boundary = `----=_ap_${randomBytes(12).toString('hex')}`;
    headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
    body = [
      `--${boundary}`,
      textPart({ subtype: 'plain', content: text }),
      `--${boundary}`,
      textPart({ subtype: 'html', content: html }),
      `--${boundary}--`,
      '',
    ].join(CRLF);
  } else {
    const subtype = text ? 'plain' : 'html';
    headers.push(
      `Content-Type: text/${subtype}; charset=UTF-8`,
      'Content-Transfer-Encoding: base64'
    );
    body = `${base64Body({ content: text ? text : html ?? '' })}${CRLF}`;
  }

  return { raw: `${headers.join(CRLF)}${CRLF}${CRLF}${body}`, messageId };
}

type ParsedAddress = { name: string; address: string };

export { assertHeaderSafe, parseAddress, buildDraftMessage };
