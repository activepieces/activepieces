type PackageInfoParams = {
  pieceName: string;
  pieceVersion: string;
}

export const getPackageAliasForPiece = (params: PackageInfoParams): string => {
  const { pieceName, pieceVersion } = params;

  return `@activepieces/piece-${pieceName}-${pieceVersion}`
}

export const getPackageVersionForPiece = (params: PackageInfoParams): string => {
  const { pieceName, pieceVersion } = params;

  return `npm:@activepieces/piece-${pieceName}@${pieceVersion}`
}
