import {
  PieceMetadata,
  PieceMetadataSummary,
} from '@activepieces/pieces-framework';
import { ProjectId, PieceType, PackageType } from '@activepieces/shared';

type PiecePackageMetadata = {
  projectId?: ProjectId;
  pieceType: PieceType;
  packageType: PackageType;
};

export type PieceMetadataModel = PieceMetadata & PiecePackageMetadata;

export type PieceMetadataModelSummary = PieceMetadataSummary &
  PiecePackageMetadata;
