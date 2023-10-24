import { ActivepiecesError, ErrorCode } from '../common/activepieces-error';
import { PackageType } from './piece';

export const getPackageAliasForPiece = (params: GetPackageAliasForPieceParams): string => {
  const { pieceName, pieceVersion } = params;
  return `${pieceName}-${pieceVersion}`
}

export const getPackageSpecForPiece = (params: GetPackageSpecForPieceParams): string => {
  const { packageType, pieceName, pieceVersion, packageArchivePath } = params

  switch (packageType) {
    case PackageType.REGISTRY: {
      return `npm:${pieceName}@${pieceVersion}`
    }

    case PackageType.ARCHIVE: {
      const archivePath = getPackageArchivePathForPiece({
        pieceName,
        pieceVersion,
        packageArchivePath,
      })

      return `file:${archivePath}`
    }
  }
}

export const getPackageArchivePathForPiece = (params: GetPackageArchivePathForPieceParams): string => {
  const { pieceName, pieceVersion, packageArchivePath } = params
  return `${packageArchivePath}/${pieceName}/${pieceVersion}.tgz`
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

type GetPackageAliasForPieceParams = {
  pieceName: string
  pieceVersion: string
}

type GetPackageSpecForPieceParams = {
  packageType: PackageType
  pieceName: string
  pieceVersion: string
  packageArchivePath: string
}

type GetPackageArchivePathForPieceParams = {
  pieceName: string
  pieceVersion: string
  packageArchivePath: string
}

type ExtractPieceFromModuleParams = {
  module: Record<string, unknown>
  pieceName: string
  pieceVersion: string
}
