import { isNil, tryParseFriendlyPieceError } from '@activepieces/core-utils';

function describeStandardError(
  standardError: string | undefined,
): string | null {
  const friendlyError = tryParseFriendlyPieceError(standardError);
  if (isNil(friendlyError)) {
    return null;
  }
  const reported = (friendlyError.apiMessage ?? friendlyError.message).trim();
  return reported.length === 0 ? null : reported;
}

export const triggerStatusErrorUtils = {
  describeStandardError,
};
