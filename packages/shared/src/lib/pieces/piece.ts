import { Static, Type } from '@sinclair/typebox'

export enum PackageType {
    ARCHIVE = 'ARCHIVE',
    REGISTRY = 'REGISTRY',
}

export enum PieceType {
    CUSTOM = 'CUSTOM',
    OFFICIAL = 'OFFICIAL',
}

export const PrivatePiecePackage = Type.Object({
    packageType: Type.Literal(PackageType.ARCHIVE),
    pieceType: Type.Enum(PieceType),
    pieceName: Type.String(),
    pieceVersion: Type.String(),
    archiveId: Type.String(),
    platformId: Type.String(),
})

export type PrivatePiecePackage = Static<typeof PrivatePiecePackage>

export const OfficialPiecePackage = Type.Object({
    packageType: Type.Literal(PackageType.REGISTRY),
    pieceType: Type.Literal(PieceType.OFFICIAL),
    pieceName: Type.String(),
    pieceVersion: Type.String(),
})

export type OfficialPiecePackage = Static<typeof OfficialPiecePackage>

export const CustomNpmPiecePackage = Type.Object({
    packageType: Type.Literal(PackageType.REGISTRY),
    pieceType: Type.Literal(PieceType.CUSTOM),
    pieceName: Type.String(),
    pieceVersion: Type.String(),
    platformId: Type.String(),
})

export type CustomNpmPiecePackage = Static<typeof CustomNpmPiecePackage>

export const PublicPiecePackage = Type.Union([OfficialPiecePackage, CustomNpmPiecePackage])
export type PublicPiecePackage = OfficialPiecePackage | CustomNpmPiecePackage

export const PiecePackage = Type.Union([PrivatePiecePackage, OfficialPiecePackage, CustomNpmPiecePackage])
export type PiecePackage = PrivatePiecePackage | OfficialPiecePackage | CustomNpmPiecePackage

export enum PieceCategory {
    ARTIFICIAL_INTELLIGENCE = 'ARTIFICIAL_INTELLIGENCE',
    COMMUNICATION = 'COMMUNICATION',
    COMMERCE = 'COMMERCE',
    CORE = 'CORE',
    UNIVERSAL_AI = 'UNIVERSAL_AI',
    FLOW_CONTROL = 'FLOW_CONTROL',
    BUSINESS_INTELLIGENCE = 'BUSINESS_INTELLIGENCE',
    ACCOUNTING = 'ACCOUNTING',
    PRODUCTIVITY = 'PRODUCTIVITY',
    CONTENT_AND_FILES = 'CONTENT_AND_FILES',
    DEVELOPER_TOOLS = 'DEVELOPER_TOOLS',
    CUSTOMER_SUPPORT = 'CUSTOMER_SUPPORT',
    FORMS_AND_SURVEYS = 'FORMS_AND_SURVEYS',
    HUMAN_RESOURCES = 'HUMAN_RESOURCES',
    PAYMENT_PROCESSING = 'PAYMENT_PROCESSING',
    MARKETING = 'MARKETING',
    SALES_AND_CRM = 'SALES_AND_CRM',
}