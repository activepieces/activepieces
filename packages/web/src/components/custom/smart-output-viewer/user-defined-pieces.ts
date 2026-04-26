const USER_DEFINED_PIECES = new Set<string>([
  '@activepieces/piece-webhook',
  '@activepieces/piece-http',
  '@activepieces/piece-json',
  '@activepieces/piece-data-mapper',
]);

function isUserDefinedPiece(pieceName: string | undefined): boolean {
  if (!pieceName) return false;
  return USER_DEFINED_PIECES.has(pieceName);
}

export { isUserDefinedPiece, USER_DEFINED_PIECES };
