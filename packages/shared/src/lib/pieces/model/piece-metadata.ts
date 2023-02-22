export type PieceBase = {
  name: string;
  displayName: string;
  logoUrl: string;
  description: string;
  version: string;
}

export type PieceMetadata = PieceBase & {
  actions: Record<string, unknown>;
  triggers: Record<string, unknown>;
};

export type PieceMetadataSummary = Omit<PieceMetadata, "actions" | "triggers">;
