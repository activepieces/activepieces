import { Static } from '@sinclair/typebox';
export declare enum PackageType {
    ARCHIVE = "ARCHIVE",
    REGISTRY = "REGISTRY"
}
export declare enum PieceType {
    CUSTOM = "CUSTOM",
    OFFICIAL = "OFFICIAL"
}
export declare const PrivatePiecePackage: import("@sinclair/typebox").TObject<{
    packageType: import("@sinclair/typebox").TLiteral<PackageType.ARCHIVE>;
    pieceType: import("@sinclair/typebox").TEnum<typeof PieceType>;
    pieceName: import("@sinclair/typebox").TString;
    pieceVersion: import("@sinclair/typebox").TString;
    archiveId: import("@sinclair/typebox").TString;
    platformId: import("@sinclair/typebox").TString;
}>;
export type PrivatePiecePackage = Static<typeof PrivatePiecePackage>;
export declare const OfficialPiecePackage: import("@sinclair/typebox").TObject<{
    packageType: import("@sinclair/typebox").TLiteral<PackageType.REGISTRY>;
    pieceType: import("@sinclair/typebox").TLiteral<PieceType.OFFICIAL>;
    pieceName: import("@sinclair/typebox").TString;
    pieceVersion: import("@sinclair/typebox").TString;
}>;
export type OfficialPiecePackage = Static<typeof OfficialPiecePackage>;
export declare const CustomNpmPiecePackage: import("@sinclair/typebox").TObject<{
    packageType: import("@sinclair/typebox").TLiteral<PackageType.REGISTRY>;
    pieceType: import("@sinclair/typebox").TLiteral<PieceType.CUSTOM>;
    pieceName: import("@sinclair/typebox").TString;
    pieceVersion: import("@sinclair/typebox").TString;
    platformId: import("@sinclair/typebox").TString;
}>;
export type CustomNpmPiecePackage = Static<typeof CustomNpmPiecePackage>;
export declare const PublicPiecePackage: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
    packageType: import("@sinclair/typebox").TLiteral<PackageType.REGISTRY>;
    pieceType: import("@sinclair/typebox").TLiteral<PieceType.OFFICIAL>;
    pieceName: import("@sinclair/typebox").TString;
    pieceVersion: import("@sinclair/typebox").TString;
}>, import("@sinclair/typebox").TObject<{
    packageType: import("@sinclair/typebox").TLiteral<PackageType.REGISTRY>;
    pieceType: import("@sinclair/typebox").TLiteral<PieceType.CUSTOM>;
    pieceName: import("@sinclair/typebox").TString;
    pieceVersion: import("@sinclair/typebox").TString;
    platformId: import("@sinclair/typebox").TString;
}>]>;
export type PublicPiecePackage = OfficialPiecePackage | CustomNpmPiecePackage;
export declare const PiecePackage: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TObject<{
    packageType: import("@sinclair/typebox").TLiteral<PackageType.ARCHIVE>;
    pieceType: import("@sinclair/typebox").TEnum<typeof PieceType>;
    pieceName: import("@sinclair/typebox").TString;
    pieceVersion: import("@sinclair/typebox").TString;
    archiveId: import("@sinclair/typebox").TString;
    platformId: import("@sinclair/typebox").TString;
}>, import("@sinclair/typebox").TObject<{
    packageType: import("@sinclair/typebox").TLiteral<PackageType.REGISTRY>;
    pieceType: import("@sinclair/typebox").TLiteral<PieceType.OFFICIAL>;
    pieceName: import("@sinclair/typebox").TString;
    pieceVersion: import("@sinclair/typebox").TString;
}>, import("@sinclair/typebox").TObject<{
    packageType: import("@sinclair/typebox").TLiteral<PackageType.REGISTRY>;
    pieceType: import("@sinclair/typebox").TLiteral<PieceType.CUSTOM>;
    pieceName: import("@sinclair/typebox").TString;
    pieceVersion: import("@sinclair/typebox").TString;
    platformId: import("@sinclair/typebox").TString;
}>]>;
export type PiecePackage = PrivatePiecePackage | OfficialPiecePackage | CustomNpmPiecePackage;
export declare enum PieceCategory {
    ARTIFICIAL_INTELLIGENCE = "ARTIFICIAL_INTELLIGENCE",
    COMMUNICATION = "COMMUNICATION",
    COMMERCE = "COMMERCE",
    CORE = "CORE",
    UNIVERSAL_AI = "UNIVERSAL_AI",
    FLOW_CONTROL = "FLOW_CONTROL",
    BUSINESS_INTELLIGENCE = "BUSINESS_INTELLIGENCE",
    ACCOUNTING = "ACCOUNTING",
    PRODUCTIVITY = "PRODUCTIVITY",
    CONTENT_AND_FILES = "CONTENT_AND_FILES",
    DEVELOPER_TOOLS = "DEVELOPER_TOOLS",
    CUSTOMER_SUPPORT = "CUSTOMER_SUPPORT",
    FORMS_AND_SURVEYS = "FORMS_AND_SURVEYS",
    HUMAN_RESOURCES = "HUMAN_RESOURCES",
    PAYMENT_PROCESSING = "PAYMENT_PROCESSING",
    MARKETING = "MARKETING",
    SALES_AND_CRM = "SALES_AND_CRM"
}
