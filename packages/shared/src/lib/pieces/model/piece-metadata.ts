import { TriggerStrategy } from "../../flows/triggers/trigger";

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

export type TriggerBase = ActionBase & {
  type: TriggerStrategy;
};

export type PieceMetadata = PieceBase & {
  actions: Record<string, ActionBase>;
  triggers: Record<string, TriggerBase>;
};

export type PieceMetadataSummary = Omit<PieceMetadata, "actions" | "triggers"> & {
  actions: number;
  triggers: number;
}
