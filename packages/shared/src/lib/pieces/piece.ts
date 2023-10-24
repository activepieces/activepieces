import { FileId } from "../file"
import { ProjectId } from "../project/project"

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
    projectId: ProjectId
    archiveId?: FileId
}

export enum PieceCategory
{
    CORE= "CORE"
}