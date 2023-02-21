export type Piece = {
    displayName: string;
    metadata(): PieceMetadata;
}

export type PieceMetadataSummary = {
  name: string;
  displayName: string;
  description: string;
  logoUrl: string;
  version: string;
}

export type PieceMetadata = PieceMetadataSummary & Record<string, unknown>;
