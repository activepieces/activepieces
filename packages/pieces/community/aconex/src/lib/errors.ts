import { HttpError } from '@activepieces/pieces-common';

const CODE_HINTS: Record<string, string> = {
  ACCESS_FAILED_FOR_PROJECT:
    'The connected user cannot call the API on this project. Quote the request id if you contact Oracle Support.',
  ACCESS_FAILED_FOR_ORG:
    'The connected user cannot call the API for this organization. Quote the request id if you contact Oracle Support.',
  API_NOT_ENABLED_FOR_PROJECT:
    'The API is not enabled on this project. Quote the request id if you contact Oracle Support.',
  USER_NOT_ON_PROJECT:
    'The connected user is not on this project. Quote the request id if you contact Oracle Support.',
  USER_ACCOUNT_LOCKED:
    'The connected user account is locked. Quote the request id if you contact Oracle Support.',
  USER_PASSWORD_EXPIRED:
    'The connected user password has expired. Quote the request id if you contact Oracle Support.',
  LOGIN_FAILED: 'Lobby or Aconex rejected the credentials. Quote the request id if you contact Oracle Support.',
  NO_SUITABLE_AUTHENTICATION_METHOD:
    'No suitable authentication method is available for this user. Quote the request id if you contact Oracle Support.',
  TWO_STEP_VERIFICATION_REQUIRED_FOR_ACCESS:
    'This account requires two-step verification, which this connection does not use.',
  SSO_REQUIRED_FOR_ACCESS: 'This account requires SSO, which this connection does not use.',
  CONCURRENCY_THROTTLE_LIMIT_REACHED:
    'Aconex concurrency throttle was still exceeded after retries. Quote the request id if you contact Oracle Support.',
  MAX_FREQUENCY_THROTTLE_LIMIT_REACHED:
    'Aconex rate throttle was still exceeded after retries. Quote the request id if you contact Oracle Support.',
  CANNOT_DOWNLOAD_EMPTY_DOCUMENT: 'Aconex cannot download an empty document.',
  CANNOT_DOWNLOAD_INFECTED_FILE: 'Aconex refused to download this file.',
  VALIDATION_FAILED: 'Validation failed.',
};

const LOBBY_HINTS: Record<string, string> = {
  invalid_aconex_account:
    'The Aconex user id does not match an account linked to this Lobby user on the selected instance.',
  inavlid_aconex_account:
    'The Aconex user id does not match an account linked to this Lobby user on the selected instance.',
  invalid_client: 'Check the client id, client secret, and lobby.',
  invalid_grant: 'The Lobby user binding was rejected. Check the user id and instance.',
};

export class AconexError extends Error {
  readonly code: string;
  readonly requestId?: string;
  readonly description?: string;

  constructor(
    code: string,
    safeMessage: string,
    extras?: { requestId?: string; description?: string },
  ) {
    super(safeMessage);
    this.name = 'AconexError';
    this.code = code;
    this.requestId = extras?.requestId;
    this.description = extras?.description;
  }
}

export class AconexAuthError extends AconexError {
  constructor(code: string, safeMessage: string) {
    super(code, safeMessage);
    this.name = 'AconexAuthError';
  }
}

export function toSafeMessage(error: unknown): string {
  if (error instanceof AconexError) {
    return error.message;
  }
  if (error instanceof HttpError) {
    return mapTransportError(error).message;
  }
  return 'Aconex request failed.';
}

export function mapTransportError(error: unknown): AconexError {
  if (error instanceof AconexError) {
    return error;
  }
  if (!(error instanceof HttpError)) {
    return new AconexError('REQUEST_FAILED', 'Aconex request failed.');
  }
  const status = error.response.status;
  const body = error.response.body;
  const xml = xmlText(body);
  if (xml) {
    if (/<!DOCTYPE/i.test(xml)) {
      return new AconexError('XML_DOCTYPE_REJECTED', 'Aconex XML that contains a DOCTYPE was rejected.');
    }
    return mapXmlError(xml, status);
  }
  const lobby = lobbyBody(body);
  if (lobby) {
    return mapLobbyError(lobby);
  }
  if (status >= 300 && status < 400) {
    return new AconexError(
      'REDIRECT_NOT_FOLLOWED',
      `Aconex returned HTTP ${status} and the piece did not follow the redirect.`,
    );
  }
  return new AconexError('REQUEST_FAILED', `Aconex request failed (HTTP ${status}).`);
}

function mapXmlError(xml: string, status: number): AconexError {
  const code = safeToken(xmlTag(xml, 'ErrorCode'));
  const requestId = safeToken(xmlTag(xml, 'RequestID'));
  const description = xmlTag(xml, 'ErrorDescription');
  if (!code) {
    return new AconexError('REQUEST_FAILED', `Aconex request failed (HTTP ${status}).`);
  }
  const fields = xmlFieldErrors(xml);
  const detail =
    code === 'VALIDATION_FAILED' && fields.length > 0
      ? `Validation failed. Fields: ${fields.join(', ')}.`
      : CODE_HINTS[code];
  return new AconexError(code, formatFailure(code, requestId, detail), {
    requestId,
    description,
  });
}

function mapLobbyError(body: { error: string; error_description?: string }): AconexError {
  const code = safeToken(body.error);
  if (!code) {
    return new AconexAuthError('LOBBY_REJECTED', 'Lobby rejected the token request.');
  }
  const hint = LOBBY_HINTS[code] ?? 'Check the client id, client secret, lobby, and user binding.';
  return new AconexAuthError(code, `Lobby rejected the token request (${code}).\n${hint}`);
}

function formatFailure(code: string, requestId: string | undefined, detail: string | undefined): string {
  const head = requestId
    ? `Aconex request failed (${code}, request ${requestId}).`
    : `Aconex request failed (${code}).`;
  return `${head}\n${detail ?? 'Quote the request id if you contact Oracle Support.'}`;
}

function xmlFieldErrors(xml: string): string[] {
  const blocks = xml.match(/<Field\b[^>]*>[\s\S]*?<\/Field>/gi) ?? [];
  const fields: string[] = [];
  for (const block of blocks) {
    const name = safeToken(xmlTag(block, 'FieldName'));
    const code = safeToken(xmlTag(block, 'ErrorCode'));
    if (name && code) {
      fields.push(`${name} ${code}`);
    }
  }
  return fields;
}

function xmlTag(xml: string, tag: string): string | undefined {
  const match = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, 'i').exec(xml);
  if (!match?.[1]) {
    return undefined;
  }
  return unescapeBasic(match[1].trim());
}

function unescapeBasic(value: string): string {
  return value.replace(/&(?:amp|lt|gt|quot|apos);/g, (entity) => {
    switch (entity) {
      case '&amp;':
        return '&';
      case '&lt;':
        return '<';
      case '&gt;':
        return '>';
      case '&quot;':
        return '"';
      case '&apos;':
        return "'";
      default:
        return entity;
    }
  });
}

function xmlText(body: unknown): string | undefined {
  if (typeof body !== 'string') {
    return undefined;
  }
  const trimmed = body.replace(/^\uFEFF/, '').trim();
  return trimmed.startsWith('<') ? trimmed : undefined;
}

function lobbyBody(body: unknown): { error: string; error_description?: string } | undefined {
  const record = asRecord(body);
  if (!record || typeof record['error'] !== 'string') {
    return undefined;
  }
  return {
    error: record['error'],
    error_description: typeof record['error_description'] === 'string' ? record['error_description'] : undefined,
  };
}

function asRecord(body: unknown): Record<string, unknown> | undefined {
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    return body as Record<string, unknown>;
  }
  if (typeof body !== 'string') {
    return undefined;
  }
  const trimmed = body.trim();
  if (!trimmed.startsWith('{')) {
    return undefined;
  }
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

function safeToken(value: string | undefined): string | undefined {
  if (!value || !/^[A-Za-z0-9_.-]{1,80}$/.test(value)) {
    return undefined;
  }
  return value;
}
