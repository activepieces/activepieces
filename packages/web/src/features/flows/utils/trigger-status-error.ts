import {
  FriendlyPieceError,
  isNil,
  tryCatchSync,
  tryParseFriendlyPieceError,
} from '@activepieces/core-utils';

function parseStandardError(
  standardError: string | undefined,
): FriendlyPieceError | null {
  return tryParseFriendlyPieceError(standardError);
}

function describeStandardError(
  standardError: string | undefined,
): string | null {
  const friendlyError = parseStandardError(standardError);
  if (isNil(friendlyError)) {
    return null;
  }
  const reported = (friendlyError.apiMessage ?? friendlyError.message).trim();
  if (reported.length === 0 || isJsonEnvelope(reported)) {
    return null;
  }
  return reported;
}

function isJsonEnvelope(value: string): boolean {
  if (!value.startsWith('{') && !value.startsWith('[')) {
    return false;
  }
  const { data, error } = tryCatchSync(() => JSON.parse(value));
  return isNil(error) && typeof data === 'object' && !isNil(data);
}

export const triggerStatusErrorUtils = {
  describeStandardError,
  parseStandardError,
};
