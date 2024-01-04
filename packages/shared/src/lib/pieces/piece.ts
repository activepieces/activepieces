import { FileId } from '../file'

export enum PackageType {
    ARCHIVE = 'ARCHIVE',
    REGISTRY = 'REGISTRY',
}

export enum PieceType {
    CUSTOM = 'CUSTOM',
    OFFICIAL = 'OFFICIAL',
}

export type PiecePackage = {
    packageType: PackageType
    pieceType: PieceType
    pieceName: string
    pieceVersion: string
    archiveId?: FileId
}

export enum PieceCategory {
    CORE = 'CORE',
}