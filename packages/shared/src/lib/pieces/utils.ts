type PackageInfoParams = {
  pieceName: string;
  pieceVersion: string;
}

export const getPackageAliasForPiece = (params: PackageInfoParams): string => {
  const { pieceName, pieceVersion } = params;
  return `${pieceName}-${pieceVersion}`
}

export const getPackageVersionForPiece = (params: PackageInfoParams): string => {
  const { pieceName, pieceVersion } = params;

  return `npm:${pieceName}@${pieceVersion}`
}
