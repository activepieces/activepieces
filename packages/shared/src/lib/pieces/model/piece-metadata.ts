export type PieceBase = {
  name: string;
  displayName: string;
  logoUrl: string;
  description: string;
  version: string;
}

export type ActionBase = {
  name: string,
  displayName: string,
  description: string,
}

export type TriggerBase = ActionBase;

export type PieceMetadata = PieceBase & {
  actions: Map<string, ActionBase>;
  triggers: Map<string, TriggerBase>;
};

export type PieceMetadataSummary = Omit<PieceMetadata, "actions" | "triggers"> & {
  actions: number;
  triggers: number;
}
