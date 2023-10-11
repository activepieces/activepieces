import {
  PieceMetadata,
  PieceMetadataSummary,
} from '@activepieces/pieces-framework';
import {
  ProjectId,
  PieceType,
  PackageType,
  FileId,
} from '@activepieces/shared';

type PiecePackageMetadata = {
  projectId?: ProjectId;
  pieceType: PieceType;
  packageType: PackageType;
  archiveId: FileId | undefined;
};

export type PieceMetadataModel = PieceMetadata & PiecePackageMetadata;

export type PieceMetadataModelSummary = PieceMetadataSummary &
  PiecePackageMetadata;
