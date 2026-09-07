function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseNumericCode(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

function getCode(error: unknown): number | undefined {
  if (!isRecord(error)) {
    return undefined;
  }
  const fromCode = parseNumericCode(error.code);
  if (fromCode !== undefined) {
    return fromCode;
  }
  if (isRecord(error.response)) {
    return parseNumericCode(error.response.status);
  }
  return undefined;
}

function getMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function throwForAction({
  error,
  action,
  scopeHint,
  notFoundMessage,
  conflictMessage,
  badRequestMessage,
}: {
  error: unknown;
  action: string;
  scopeHint: string;
  notFoundMessage?: string;
  conflictMessage?: string;
  badRequestMessage?: string;
}): never {
  const errorCode = getCode(error);
  switch (errorCode) {
    case 403:
      throw new Error(
        `Insufficient permissions to ${action}. Reconnect your Gmail account so the ${scopeHint} scope is granted.`
      );
    case 404:
      throw new Error(
        notFoundMessage ?? `The requested Gmail resource was not found.`
      );
    case 409:
      throw new Error(
        conflictMessage ?? `The requested Gmail resource already exists.`
      );
    case 400:
      throw new Error(
        badRequestMessage ?? `Invalid Gmail request while trying to ${action}.`
      );
    case 429:
      throw new Error('Gmail API rate limit exceeded. Please try again later.');
    default:
      throw new Error(`Failed to ${action}: ${getMessage(error)}`);
  }
}

export const gmailApiErrors = {
  getCode,
  getMessage,
  throwForAction,
};
