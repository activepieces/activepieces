import semverMajor from 'semver/functions/major'
import semverMinor from 'semver/functions/minor'
import semverMinVersion from 'semver/ranges/min-version'
import { isNil } from '../common'
import { ActivepiecesError, ErrorCode } from '../common/activepieces-error'
import { PackageType, PiecePackage } from './piece'

export const branchedPieceResponse = (params?: BranchedPieceRequestType): BranchedResponseType => {
    const versions = {
        v1: (): BranchedResponseTypeV1 => {
            const currentVersion = 'v1'
            if (isNil(params)) {
                return {
                    version: currentVersion,
                    output: new Map(),
                }
            } 

            const { version: _, ...paramsWithoutVersion } = params 
            return {
                version: currentVersion,
                output: new Map(Object.entries(paramsWithoutVersion)),
            }
        },
    }
    
    return params?.version ? versions[params?.version]() : versions['v1']()
}

export const getPackageAliasForPiece = (params: GetPackageAliasForPieceParams): string => {
    const { pieceName, pieceVersion } = params
    return `${pieceName}-${pieceVersion}`
}

export const getPackageSpecForPiece = (packageArchivePath: string, params: PiecePackage): string => {
    const { packageType, pieceName, pieceVersion } = params

    switch (packageType) {
        case PackageType.REGISTRY: {
            return `npm:${pieceName}@${pieceVersion}`
        }

        case PackageType.ARCHIVE: {
            const archivePath = getPackageArchivePathForPiece({
                archiveId: params.archiveId,
                archivePath: packageArchivePath,
            })

            return `file:${archivePath}`
        }
    }
}

export const getPackageArchivePathForPiece = (params: GetPackageArchivePathForPieceParams): string => {
    return `${params.archivePath}/${params.archiveId}.tgz`
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
            message: 'Failed to extract piece from module.',
        },
    })
}

export const getPieceMajorAndMinorVersion = (pieceVersion: string): string => {
    const minimumSemver = semverMinVersion(pieceVersion)
    return minimumSemver
        ? `${semverMajor(minimumSemver)}.${semverMinor(minimumSemver)}`
        : `${semverMajor(pieceVersion)}.${semverMinor(pieceVersion)}`
}

type GetPackageAliasForPieceParams = {
    pieceName: string
    pieceVersion: string
}


type GetPackageArchivePathForPieceParams = {
    archiveId: string
    archivePath: string
}

type ExtractPieceFromModuleParams = {
    module: Record<string, unknown>
    pieceName: string
    pieceVersion: string
}

type BranchedPieceRequestTypeV1 = {
    version?: 'v1'
} & {
    [key: string]: boolean | undefined | null
}

type BranchedResponseTypeV1 =  {
    version: 'v1'
    output: Map<string, boolean | undefined | null> 
}

type BranchedPieceRequestType = BranchedPieceRequestTypeV1

type BranchedResponseType = BranchedResponseTypeV1
