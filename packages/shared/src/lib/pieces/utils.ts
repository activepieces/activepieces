import { ActivepiecesError, ErrorCode } from "../common/activepieces-error";

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

type ExtractPieceFromModuleParams = {
  module: Record<string, unknown>
  pieceName: string
  pieceVersion: string
}

export const extractPieceFromModule = <T>(params: ExtractPieceFromModuleParams): T => {
  const { module, pieceName, pieceVersion } = params
  const exports = Object.values(module)

  for (const e of exports) {
    if (e !== null && e !== undefined && e.constructor.name === 'Piece') {
      return e as T
    }
  }

  throw new ActivepiecesError({
    code: ErrorCode.PIECE_NOT_FOUND,
    params: {
      pieceName,
      pieceVersion,
    }
  })
}
