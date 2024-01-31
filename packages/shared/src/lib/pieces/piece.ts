import { Static, Type } from '@sinclair/typebox';

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
});

export type PrivatePiecePackage = Static<typeof PrivatePiecePackage>;

export const PublicPiecePackage = Type.Object({
  packageType: Type.Literal(PackageType.REGISTRY),
  pieceType: Type.Enum(PieceType),
  pieceName: Type.String(),
  pieceVersion: Type.String(),
});

export type PublicPiecePackage = Static<typeof PublicPiecePackage>;

export type PiecePackage = PrivatePiecePackage | PublicPiecePackage;

export enum PieceCategory {
  CORE = 'CORE',
  AI = 'AI',
  CONTENT_AND_FILES = 'CONTENT_AND_FILES',
  HR = 'HR',
  SALES_AND_CRM = 'SALES_AND_CRM',
  MARKETING = 'MARKETING',
  CUSTOMER_SERVICE = 'CUSTOMER_SERVICE',
  PROJECT_MANAGEMENT = 'PROJECT_MANAGEMENT',
}
